from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json


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

        await self.channel_layer.group_send(
            self.group_name,
            {"type": "board_event", "message": data}
        )

        if data["type"] == "restore_snapshot":
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
            user = self.scope.get("user")
            if user and user.is_authenticated:
                activity = await self.save_activity(data, user)
                if activity:
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "board_event",
                            "message": {
                                "type": "activity_created",
                                "activity": {
                                    "id": str(activity.id),
                                    "user": {
                                        "id": user.id,
                                        "username": user.username,
                                    },
                                    "action_type": activity.action_type,
                                    "payload": activity.payload,
                                    "snapshot": activity.snapshot,
                                    "created_at": activity.created_at.isoformat(),
                                }
                            }
                        }
                    )

    async def board_event(self, event):
        await self.send(text_data=json.dumps(event["message"]))

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