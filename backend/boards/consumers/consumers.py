from channels.generic.websocket import AsyncWebsocketConsumer
import json
import logging
from .db_operations import (
    apply_inverse_diff,
    apply_diff_to_db,
    apply_snapshot_to_db,
    save_activity,
    save_restore_activity,
    truncate_user_activities_after,
    delete_activities_after_sequence,
    load_user_undo_stack,
)

logger = logging.getLogger("board.consumer")

_undo_stacks: dict = {}

# Track active users per board: { board_id: { channel_name: { user_id, username } } }
_active_users: dict = {}

TRACKED = {
    "create_shape", "delete_shape", "delete_many",
    "move_shape", "move_many", "resize_shape", "resize_many",
    "update_color", "update_text", "update_object",
    "bring_forward", "send_back", "bring_to_front", "send_to_back",
    "bold_text", "italic_text", "font_size", "align_text",
    "font_family", "text_color", "update_color_many",
}


def get_user_stacks(board_id: str, user_id: int):
    if board_id not in _undo_stacks:
        _undo_stacks[board_id] = {}
    if user_id not in _undo_stacks[board_id]:
        _undo_stacks[board_id][user_id] = {"undo": [], "redo": []}
    return _undo_stacks[board_id][user_id]


def get_active_users(board_id: str):
    return list(_active_users.get(board_id, {}).values())


class BoardConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.board_id = self.scope["url_route"]["kwargs"]["board_id"]
        self.group_name = f"board_{self.board_id}"
        self.user = self.scope.get("user")
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        print("CONNECTED:", self.channel_name)

        if self.user and self.user.is_authenticated:
            stacks = get_user_stacks(self.board_id, self.user.id)
            if not stacks["undo"]:
                stacks["undo"] = await load_user_undo_stack(self.board_id, self.user.id)

            # Register user as active
            if self.board_id not in _active_users:
                _active_users[self.board_id] = {}
            _active_users[self.board_id][self.channel_name] = {
                "user_id": self.user.id,
                "username": self.user.username,
            }

            # Send current user list to the joining user
            await self.send(text_data=json.dumps({
                "type": "presence_init",
                "users": get_active_users(self.board_id),
            }))

            # Broadcast join to everyone else
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "board_event_others",
                    "message": {
                        "type": "user_joined",
                        "user": {"user_id": self.user.id, "username": self.user.username},
                    },
                    "sender_channel": self.channel_name,
                }
            )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

        if self.user and self.user.is_authenticated:
            if self.board_id in _active_users:
                _active_users[self.board_id].pop(self.channel_name, None)

            # Broadcast leave to everyone
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "board_event",
                    "message": {
                        "type": "user_left",
                        "user_id": self.user.id,
                    },
                }
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if "type" not in data:
            return

        user = self.scope.get("user")
        msg_type = data["type"]

        # Handle cursor moves — broadcast to others only, no DB
        if msg_type == "cursor_move":
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "board_event_others",
                    "message": {
                        "type": "cursor_move",
                        "user_id": user.id if user and user.is_authenticated else None,
                        "x": data.get("x"),
                        "y": data.get("y"),
                    },
                    "sender_channel": self.channel_name,
                }
            )
            return
        
        if msg_type == "selection_update":
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "board_event_others",
                    "message": {
                        "type": "selection_update",
                        "user_id": user.id if user.is_authenticated else None,
                        "selected_ids": data.get("selected_ids", []),
                    },
                    "sender_channel": self.channel_name,
                }
            )
            return

        if msg_type == "undo":
            await self._handle_undo(user)
            return

        if msg_type == "redo":
            await self._handle_redo(user)
            return

        if msg_type == "restore_snapshot":
            await self._handle_restore(data, user)
            return

        # broadcast all other messages to everyone
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "board_event", "message": data}
        )

        if msg_type in TRACKED:
            await self._handle_tracked(data, user)

    # ── handlers ─────────────────────────────────────────────────────

    async def _handle_undo(self, user):
        if not user or not user.is_authenticated:
            return
        stacks = get_user_stacks(self.board_id, user.id)
        if not stacks["undo"]:
            return

        entry = stacks["undo"].pop()
        stacks["redo"].append(entry)

        inv_diff = await apply_inverse_diff(self.board_id, entry["diff"])
        if inv_diff is None:
            stacks["undo"].append(stacks["redo"].pop())
            return

        cursor_sequence = stacks["undo"][-1]["sequence"] if stacks["undo"] else 0

        msg = {
            "type": "undo_applied",
            "inv_diff": inv_diff,
            "activity_id": entry.get("activity_id"),
            "cursor_sequence": cursor_sequence,
            "user_id": user.id,
        }
        await self._send_to_sender_and_others(msg)

    async def _handle_redo(self, user):
        if not user or not user.is_authenticated:
            return
        stacks = get_user_stacks(self.board_id, user.id)
        if not stacks["redo"]:
            return

        entry = stacks["redo"].pop()
        stacks["undo"].append(entry)

        success = await apply_diff_to_db(self.board_id, entry["diff"])
        if not success:
            stacks["redo"].append(stacks["undo"].pop())
            return

        msg = {
            "type": "redo_applied",
            "diff": entry["diff"],
            "activity_id": entry.get("activity_id"),
            "cursor_sequence": entry["sequence"],
            "user_id": user.id,
        }
        await self._send_to_sender_and_others(msg)

    async def _handle_restore(self, data, user):
        sequence = data.get("sequence", 0)

        if self.board_id in _undo_stacks:
            for uid in _undo_stacks[self.board_id]:
                _undo_stacks[self.board_id][uid] = {"undo": [], "redo": []}

        deleted_ids = await delete_activities_after_sequence(self.board_id, sequence)
        await apply_snapshot_to_db(self.board_id, data["snapshot"])

        if self.board_id in _undo_stacks:
            for uid in _undo_stacks[self.board_id]:
                _undo_stacks[self.board_id][uid]["undo"] = await load_user_undo_stack(self.board_id, uid)

        restore_activity = await save_restore_activity(self.board_id, user)

        msg = {
            "type": "restore_snapshot",
            "snapshot": data["snapshot"],
            "deleted_ids": deleted_ids,
            "activity": {
                "id": str(restore_activity.id),
                "user": {"id": user.id, "username": user.username},
                "action_type": "restore",
                "diff": None,
                "sequence": restore_activity.sequence,
                "created_at": restore_activity.created_at.isoformat(),
            } if restore_activity else None,
        }
        await self._send_to_sender_and_others(msg)

    async def _handle_tracked(self, data, user):
        if not user or not user.is_authenticated:
            return

        diff = data.get("diff")
        if diff is None:
            return

        stacks = get_user_stacks(self.board_id, user.id)

        deleted_ids = []
        if stacks["redo"]:
            cursor_seq = stacks["undo"][-1]["sequence"] if stacks["undo"] else 0
            deleted_ids = await truncate_user_activities_after(self.board_id, cursor_seq, user.id)
            if self.board_id in _undo_stacks:
                for uid in _undo_stacks[self.board_id]:
                    _undo_stacks[self.board_id][uid]["redo"] = []

        activity = await save_activity(self.board_id, data, user, diff)
        if not activity:
            return

        stacks["undo"].append({
            "diff": diff,
            "activity_id": str(activity.id),
            "sequence": activity.sequence,
        })
        if len(stacks["undo"]) > 50:
            stacks["undo"] = stacks["undo"][-50:]

        activity_message = {
            "type": "activity_created",
            "activity": {
                "id": str(activity.id),
                "user": {"id": user.id, "username": user.username},
                "action_type": activity.action_type,
                "diff": activity.diff,
                "sequence": activity.sequence,
                "created_at": activity.created_at.isoformat(),
            },
            "deleted_ids": deleted_ids,
        }
        await self.send(text_data=json.dumps(activity_message))
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "board_event_others", "message": activity_message, "sender_channel": self.channel_name}
        )

    # ── utils ─────────────────────────────────────────────────────────

    async def _send_to_sender_and_others(self, msg):
        await self.send(text_data=json.dumps(msg))
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "board_event_others", "message": msg, "sender_channel": self.channel_name}
        )

    async def board_event(self, event):
        await self.send(text_data=json.dumps(event["message"]))

    async def board_event_others(self, event):
        if self.channel_name != event["sender_channel"]:
            await self.send(text_data=json.dumps(event["message"]))