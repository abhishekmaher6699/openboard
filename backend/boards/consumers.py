from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json

# per-board undo/redo stacks stored in memory
# { board_id: { "undo": [...snapshots], "redo": [...snapshots] } }
_undo_stacks: dict = {}

def get_stacks(board_id: str):
    if board_id not in _undo_stacks:
        _undo_stacks[board_id] = {"undo": [], "redo": []}
    return _undo_stacks[board_id]


class BoardConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.board_id = self.scope["url_route"]["kwargs"]["board_id"]
        self.group_name = f"board_{self.board_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)

        if "type" not in data:
            return

        # handle undo
        if data["type"] == "undo":
            stacks = get_stacks(self.board_id)
            if not stacks["undo"]:
                return
            # get current state before undoing
            current = await self.get_snapshot()
            snapshot = stacks["undo"].pop()
            stacks["redo"].append(current)
            await self.apply_snapshot(snapshot)
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "board_event", "message": {"type": "restore_snapshot", "snapshot": snapshot}}
            )
            return

        # handle redo
        if data["type"] == "redo":
            stacks = get_stacks(self.board_id)
            if not stacks["redo"]:
                return
            current = await self.get_snapshot()
            snapshot = stacks["redo"].pop()
            stacks["undo"].append(current)
            await self.apply_snapshot(snapshot)
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "board_event", "message": {"type": "restore_snapshot", "snapshot": snapshot}}
            )
            return

        # broadcast action to all clients
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "board_event", "message": data}
        )

        if data["type"] == "restore_snapshot":
            # clear redo stack on manual restore
            get_stacks(self.board_id)["redo"] = []
            await self.apply_snapshot(data["snapshot"])
            return

        tracked = {
            "create_shape", "delete_shape", "delete_many",
            "move_shape", "move_many", "resize_shape", "resize_many",
            "update_color", "update_text", "update_object",
            "bring_forward", "send_back", "bring_to_front", "send_to_back",
            "bold_text", "italic_text", "font_size", "align_text",
            "font_family", "text_color",
        }

        if data["type"] in tracked:
            # push before_snapshot onto undo stack, clear redo
            before = data.get("before_snapshot")
            if before is not None:
                stacks = get_stacks(self.board_id)
                stacks["undo"].append(before)
                stacks["redo"] = []
                # cap stack size
                if len(stacks["undo"]) > 50:
                    stacks["undo"] = stacks["undo"][-50:]

            user = self.scope.get("user")
            if user and user.is_authenticated:
                activity = await self.save_activity(data, user)
                if activity:
                    activity_message = {
                        "type": "activity_created",
                        "activity": {
                            "id": str(activity.id),
                            "user": {"id": user.id, "username": user.username},
                            "action_type": activity.action_type,
                            "payload": activity.payload,
                            "snapshot": activity.snapshot,
                            "created_at": activity.created_at.isoformat(),
                        }
                    }
                    await self.send(text_data=json.dumps(activity_message))
                    await self.channel_layer.group_send(
                        self.group_name,
                        {"type": "board_event_others", "message": activity_message, "sender_channel": self.channel_name}
                    )

    async def board_event(self, event):
        await self.send(text_data=json.dumps(event["message"]))

    async def board_event_others(self, event):
        if self.channel_name != event["sender_channel"]:
            await self.send(text_data=json.dumps(event["message"]))

    @database_sync_to_async
    def get_snapshot(self):
        from boards.models import Board
        from board_objects.models import BoardObject
        from board_objects.serializers import BoardObjectSerializer

        try:
            board = Board.objects.get(public_id=self.board_id)
        except Board.DoesNotExist:
            return []

        objects = BoardObject.objects.filter(board=board)
        return list(BoardObjectSerializer(objects, many=True).data)

    @database_sync_to_async
    def save_activity(self, data, user):
        from boards.models import Board
        from activity.models import BoardActivity

        try:
            board = Board.objects.get(public_id=self.board_id)
        except Board.DoesNotExist:
            return None

        snapshot = data.get("before_snapshot", [])

        return BoardActivity.objects.create(
            board=board,
            user=user,
            action_type=data["type"],
            payload=data,
            snapshot=snapshot,
        )

    @database_sync_to_async
    def apply_snapshot(self, snapshot):
        from boards.models import Board
        from board_objects.models import BoardObject

        try:
            board = Board.objects.get(public_id=self.board_id)
        except Board.DoesNotExist:
            return

        BoardObject.objects.filter(board=board).delete()

        for obj_data in snapshot:
            BoardObject.objects.create(
                id=obj_data["id"],
                board=board,
                type=obj_data["type"],
                x=obj_data["x"],
                y=obj_data["y"],
                width=obj_data.get("width"),
                height=obj_data.get("height"),
                rotation=obj_data.get("rotation", 0),
                z_index=obj_data.get("z_index", 0),
                locked=obj_data.get("locked", False),
                data=obj_data.get("data", {}),
            )