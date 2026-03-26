from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
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

logger = logging.getLogger("board")

_undo_stacks: dict = {}
_active_users: dict = {}
_kicked_users: dict = {} 

TRACKED = {
    "create_shape", "delete_shape", "delete_many",
    "move_shape", "move_many", "resize_shape", "resize_many",
    "update_color", "update_text", "update_object",
    "bring_forward", "send_back", "bring_to_front", "send_to_back",
    "bold_text", "italic_text", "font_size", "align_text",
    "font_family", "text_color", "update_color_many", "update_object_many"
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

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4401)
            return

        if not await self._user_can_access_board():
            await self.close(code=4403)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        logger.info(f"CONNECT user={self.user} board={self.board_id}")
        # logger.debug(f"ACTIVE USERS: {len(_active_users[self.board_id])}")
        stacks = get_user_stacks(self.board_id, self.user.id)
        if not stacks["undo"]:
            stacks["undo"] = await load_user_undo_stack(self.board_id, self.user.id)

        if self.board_id not in _active_users:
            _active_users[self.board_id] = {}
        _active_users[self.board_id][self.channel_name] = {
            "user_id": self.user.id,
            "username": self.user.username,
        }

        await self.send(text_data=json.dumps({
            "type": "presence_init",
            "users": get_active_users(self.board_id),
        }))

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

        logger.info(f"DISCONNECT user={self.user} board={self.board_id}")

        if self.user and self.user.is_authenticated:
            _active_users.get(self.board_id, {}).pop(self.channel_name, None)

            board_kicked = _kicked_users.get(self.board_id, set())
            if self.user.id in board_kicked:
                board_kicked.discard(self.user.id)
                return

            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "board_event",
                    "message": {
                        "type": "user_left",
                        "user_id": self.user.id,
                        "username": self.user.username,
                    },
                }
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if "type" not in data:
            return

        user = self.scope.get("user")
        msg_type = data["type"]

        # logger.debug(f"RECEIVE type={data.get('type')} user={user}")

        if msg_type == "cursor_move":
            # logger.info(f"ACTION {msg_type} user={user.id if user else None}")
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

        if msg_type == "chat_message":
            await self._handle_chat_message(data, user)
            return

        if msg_type == "chat_reaction":
            await self._handle_chat_reaction(data, user)
            return

        if msg_type == "kick_user":
            await self._handle_kick(data, user)
            return

        await self.channel_layer.group_send(
            self.group_name,
            {"type": "board_event", "message": data}
        )

        if msg_type in TRACKED:
            await self._handle_tracked(data, user)

    # ── handlers ─────────────────────────────────────────────────────

    async def _handle_undo(self, user):
        logger.info(f"UNDO user={user.id} board={self.board_id}")
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
        logger.info(f"REDO user={user.id} board={self.board_id}")
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
        if not user or not user.is_authenticated:
            return

        if not await self._user_is_board_owner():
            await self.send(text_data=json.dumps({
                "type": "error",
                "detail": "Only the board owner can restore the board.",
            }))
            return

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

    async def _handle_chat_message(self, data, user):
        if not user or not user.is_authenticated:
            return
        import uuid

        text = data.get("text", "").strip()
        if not text:
            return

        msg = {
            "type": "chat_message",
            "id": str(uuid.uuid4()),
            "user_id": user.id,
            "username": user.username,
            "text": text,
            "reactions": {},
        }
        await self._send_to_sender_and_others(msg)

    async def _handle_chat_reaction(self, data, user):
        if not user or not user.is_authenticated:
            return

        await self._send_to_sender_and_others({
            "type": "chat_reaction",
            "message_id": data.get("message_id"),
            "emoji": data.get("emoji"),
            "user_id": user.id,
        })

    async def _handle_kick(self, data, user):
        if not user or not user.is_authenticated:
            return

        target_id = data.get("user_id")
        if not target_id:
            return

        @database_sync_to_async
        def do_kick():
            from boards.models import Board
            from django.contrib.auth.models import User as DjangoUser
            try:
                board = Board.objects.get(public_id=self.board_id)
                if board.owner != user:
                    return None
                target = DjangoUser.objects.get(id=target_id)
                if target not in board.members.all():
                    return None
                board.members.remove(target)
                return {"user_id": target.id, "username": target.username}
            except Exception:
                return None

        result = await do_kick()
        if not result:
            return
        


        # Mark as kicked BEFORE broadcasting so disconnect skips user_left
        if self.board_id not in _kicked_users:
            _kicked_users[self.board_id] = set()
        _kicked_users[self.board_id].add(result["user_id"])

        logger.warning(f"USER KICKED id={result['user_id']} board={self.board_id}")

        await self._send_to_sender_and_others({
            "type": "user_kicked",
            "user_id": result["user_id"],
            "username": result["username"],
        })

    @database_sync_to_async
    def _user_can_access_board(self):
        from boards.access import user_can_access_board
        from boards.models import Board

        try:
            board = Board.objects.get(public_id=self.board_id)
        except Board.DoesNotExist:
            return False

        return user_can_access_board(self.user, board)

    @database_sync_to_async
    def _user_is_board_owner(self):
        from boards.models import Board

        try:
            board = Board.objects.get(public_id=self.board_id)
        except Board.DoesNotExist:
            return False

        return board.owner_id == self.user.id

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
