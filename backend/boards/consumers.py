from channels.generic.websocket import AsyncWebsocketConsumer
import json

class BoardConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.board_id = self.scope["url_route"]["kwargs"]["board_id"]
        self.group_name = f"board_{self.board_id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def receive(self, text_data):
        # print(f"Received data: {text_data}")
        data = json.loads(text_data)

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "board_event",
                "message": data
            }
        )

    async def board_event(self, event):
        await self.send(text_data=json.dumps(event["message"]))