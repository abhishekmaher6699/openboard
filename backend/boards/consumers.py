from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db import transaction
from django.db.models import Max
import json
import logging

logger = logging.getLogger("board.consumer")


_undo_stacks: dict = {}


def get_user_stacks(board_id: str, user_id: int):
    if board_id not in _undo_stacks:
        _undo_stacks[board_id] = {}
    if user_id not in _undo_stacks[board_id]:
        _undo_stacks[board_id][user_id] = {"undo": [], "redo": []}
    return _undo_stacks[board_id][user_id]


class BoardConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.board_id = self.scope["url_route"]["kwargs"]["board_id"]
        self.group_name = f"board_{self.board_id}"
        self.user = self.scope.get("user")
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        if self.user and self.user.is_authenticated:
            stacks = get_user_stacks(self.board_id, self.user.id)
            if not stacks["undo"]:
                stacks["undo"] = await self.load_user_undo_stack(self.user.id)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):

        data = json.loads(text_data)
        user = self.scope.get("user")

        logger.debug(f"receive: type={data.get('type')} user={user} is_authenticated={getattr(user, 'is_authenticated', False)}")

        if "type" not in data:
            return


        if data["type"] == "undo":
            if not user or not user.is_authenticated:
                return
            stacks = get_user_stacks(self.board_id, user.id)
            if not stacks["undo"]:
                return

            entry = stacks["undo"].pop()
            stacks["redo"].append(entry)

            inv_diff = await self.apply_inverse_diff(entry["diff"])
            if inv_diff is None:
                stacks["undo"].append(stacks["redo"].pop())
                return

            # uence = sequence of the entry BEFORE the one we just undid
            # i.e. the top of the undo stack after popping
            cursor_sequence = stacks["undo"][-1]["sequence"] if stacks["undo"] else 0

            msg = {
                "type": "undo_applied",
                "inv_diff": inv_diff,
                "activity_id": entry.get("activity_id"),
                "cursor_sequence": cursor_sequence,
                "user_id": user.id,
            }
            await self.send(text_data=json.dumps(msg))
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "board_event_others", "message": msg, "sender_channel": self.channel_name}
            )
            return

        if data["type"] == "redo":
            if not user or not user.is_authenticated:
                return
            stacks = get_user_stacks(self.board_id, user.id)
            if not stacks["redo"]:
                return

            entry = stacks["redo"].pop()
            stacks["undo"].append(entry)

            success = await self.apply_diff_to_db(entry["diff"])
            if not success:
                stacks["redo"].append(stacks["undo"].pop())
                return

            # cursor_sequence = sequence of the entry we just redid
            cursor_sequence = entry["sequence"]

            msg = {
                "type": "redo_applied",
                "diff": entry["diff"],
                "activity_id": entry.get("activity_id"),
                "cursor_sequence": cursor_sequence,
                "user_id": user.id,
            }
            await self.send(text_data=json.dumps(msg))
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "board_event_others", "message": msg, "sender_channel": self.channel_name}
            )
            return

        await self.channel_layer.group_send(
            self.group_name,
            {"type": "board_event", "message": data}
        )

        if data["type"] == "restore_snapshot":
            sequence = data.get("sequence", 0)
            
            if self.board_id in _undo_stacks:
                for uid in _undo_stacks[self.board_id]:
                    _undo_stacks[self.board_id][uid]["undo"] = []
                    _undo_stacks[self.board_id][uid]["redo"] = []
            
            deleted_ids = await self.delete_activities_after_sequence(sequence)
            await self.apply_snapshot(data["snapshot"])

            if self.board_id in _undo_stacks:
                for uid in _undo_stacks[self.board_id]:
                    _undo_stacks[self.board_id][uid]["undo"] = await self.load_user_undo_stack(uid)

            # save restore activity — no diff, not undoable
            restore_activity = await self.save_restore_activity(user)

            restore_message = {
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
            await self.send(text_data=json.dumps(restore_message))
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "board_event_others", "message": restore_message, "sender_channel": self.channel_name}
            )
            return 
        
        tracked = {
            "create_shape", "delete_shape", "delete_many",
            "move_shape", "move_many", "resize_shape", "resize_many",
            "update_color", "update_text", "update_object",
            "bring_forward", "send_back", "bring_to_front", "send_to_back",
            "bold_text", "italic_text", "font_size", "align_text",
            "font_family", "text_color", "update_color_many",
        }

        if data["type"] in tracked:
            diff = data.get("diff")
            if diff is None:
                return

            if user and user.is_authenticated:
                stacks = get_user_stacks(self.board_id, user.id)

                deleted_ids = []
                if stacks["redo"]:
                    cursor_seq = stacks["undo"][-1]["sequence"] if stacks["undo"] else 0
                    # only delete THIS user's activities after their cursor
                    deleted_ids = await self.truncate_user_activities_after(cursor_seq, user.id)
                    # clear ALL users' redo stacks — branch is gone
                    if self.board_id in _undo_stacks:
                        for uid in _undo_stacks[self.board_id]:
                            _undo_stacks[self.board_id][uid]["redo"] = []
                    
                    logger.debug("cursor_seq:", cursor_seq)
                    logger.debug("deleted_ids:", deleted_ids)
                    logger.debug("undo stack after purge:", [(e["activity_id"], e["sequence"]) for e in stacks["undo"]])

                activity = await self.save_activity(data, user, diff)
                if activity:
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
                        # tell all clients which activities were deleted
                        "deleted_ids": deleted_ids,
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
    def apply_inverse_diff(self, diff: dict):
        from boards.models import Board
        from board_objects.models import BoardObject

        try:
            board = Board.objects.get(public_id=self.board_id)
        except Board.DoesNotExist:
            return None

        diff_type = diff.get("type")

        if diff_type == "create":
            BoardObject.objects.filter(board=board, id=diff["object"]["id"]).delete()
            return {"type": "delete", "object": diff["object"]}

        if diff_type == "delete":
            obj_data = diff["object"]
            BoardObject.objects.get_or_create(
                id=obj_data["id"], board=board,
                defaults={
                    "type": obj_data["type"], "x": obj_data["x"], "y": obj_data["y"],
                    "width": obj_data.get("width"), "height": obj_data.get("height"),
                    "rotation": obj_data.get("rotation", 0), "z_index": obj_data.get("z_index", 0),
                    "locked": obj_data.get("locked", False), "data": obj_data.get("data", {}),
                }
            )
            return {"type": "create", "object": diff["object"]}

        if diff_type == "delete_many":
            for obj_data in diff["objects"]:
                BoardObject.objects.get_or_create(
                    id=obj_data["id"], board=board,
                    defaults={
                        "type": obj_data["type"], "x": obj_data["x"], "y": obj_data["y"],
                        "width": obj_data.get("width"), "height": obj_data.get("height"),
                        "rotation": obj_data.get("rotation", 0), "z_index": obj_data.get("z_index", 0),
                        "locked": obj_data.get("locked", False), "data": obj_data.get("data", {}),
                    }
                )
            return {"type": "create_many", "objects": diff["objects"]}

        if diff_type == "move":
            BoardObject.objects.filter(board=board, id=diff["id"]).update(
                x=diff["from"]["x"], y=diff["from"]["y"]
            )
            return {"type": "move", "id": diff["id"], "from": diff["to"], "to": diff["from"]}

        if diff_type == "move_many":
            for m in diff["moves"]:
                BoardObject.objects.filter(board=board, id=m["id"]).update(
                    x=m["from"]["x"], y=m["from"]["y"]
                )
            return {
                "type": "move_many",
                "moves": [{"id": m["id"], "from": m["to"], "to": m["from"]} for m in diff["moves"]]
            }

        if diff_type == "resize":
            BoardObject.objects.filter(board=board, id=diff["id"]).update(
                x=diff["from"]["x"], y=diff["from"]["y"],
                width=diff["from"]["width"], height=diff["from"]["height"]
            )
            return {"type": "resize", "id": diff["id"], "from": diff["to"], "to": diff["from"]}

        if diff_type == "resize_many":
            for r in diff["resizes"]:
                BoardObject.objects.filter(board=board, id=r["id"]).update(
                    x=r["from"]["x"], y=r["from"]["y"],
                    width=r["from"]["width"], height=r["from"]["height"]
                )
            return {
                "type": "resize_many",
                "resizes": [{"id": r["id"], "from": r["to"], "to": r["from"]} for r in diff["resizes"]]
            }

        if diff_type == "update":
            obj = BoardObject.objects.filter(board=board, id=diff["id"]).first()
            if obj:
                from_data = diff["from"]
                if "data" in from_data:
                    new_data = {**obj.data, **from_data["data"]}
                    BoardObject.objects.filter(board=board, id=diff["id"]).update(data=new_data)
                else:
                    BoardObject.objects.filter(board=board, id=diff["id"]).update(**from_data)
            return {"type": "update", "id": diff["id"], "from": diff["to"], "to": diff["from"]}

        if diff_type == "update_many":
            for u in diff["updates"]:
                obj = BoardObject.objects.filter(board=board, id=u["id"]).first()
                if obj:
                    from_data = u["from"]
                    if "data" in from_data:
                        new_data = {**obj.data, **from_data["data"]}
                        BoardObject.objects.filter(board=board, id=u["id"]).update(data=new_data)
                    else:
                        BoardObject.objects.filter(board=board, id=u["id"]).update(**from_data)
            return {
                "type": "update_many",
                "updates": [{"id": u["id"], "from": u["to"], "to": u["from"]} for u in diff["updates"]]
            }
        
        return None

    @database_sync_to_async
    def apply_diff_to_db(self, diff: dict):
        from boards.models import Board
        from board_objects.models import BoardObject

        try:
            board = Board.objects.get(public_id=self.board_id)
        except Board.DoesNotExist:
            return False

        diff_type = diff.get("type")

        if diff_type == "create":
            obj_data = diff["object"]
            BoardObject.objects.get_or_create(
                id=obj_data["id"], board=board,
                defaults={
                    "type": obj_data["type"], "x": obj_data["x"], "y": obj_data["y"],
                    "width": obj_data.get("width"), "height": obj_data.get("height"),
                    "rotation": obj_data.get("rotation", 0), "z_index": obj_data.get("z_index", 0),
                    "locked": obj_data.get("locked", False), "data": obj_data.get("data", {}),
                }
            )
            return True

        if diff_type == "delete":
            BoardObject.objects.filter(board=board, id=diff["object"]["id"]).delete()
            return True

        if diff_type == "delete_many":
            ids = [o["id"] for o in diff["objects"]]
            BoardObject.objects.filter(board=board, id__in=ids).delete()
            return True

        if diff_type == "move":
            BoardObject.objects.filter(board=board, id=diff["id"]).update(
                x=diff["to"]["x"], y=diff["to"]["y"]
            )
            return True

        if diff_type == "move_many":
            for m in diff["moves"]:
                BoardObject.objects.filter(board=board, id=m["id"]).update(
                    x=m["to"]["x"], y=m["to"]["y"]
                )
            return True

        if diff_type == "resize":
            BoardObject.objects.filter(board=board, id=diff["id"]).update(
                x=diff["to"]["x"], y=diff["to"]["y"],
                width=diff["to"]["width"], height=diff["to"]["height"]
            )
            return True

        if diff_type == "resize_many":
            for r in diff["resizes"]:
                BoardObject.objects.filter(board=board, id=r["id"]).update(
                    x=r["to"]["x"], y=r["to"]["y"],
                    width=r["to"]["width"], height=r["to"]["height"]
                )
            return True

        if diff_type == "update":
            obj = BoardObject.objects.filter(board=board, id=diff["id"]).first()
            if obj:
                to_data = diff["to"]
                if "data" in to_data:
                    new_data = {**obj.data, **to_data["data"]}
                    BoardObject.objects.filter(board=board, id=diff["id"]).update(data=new_data)
                else:
                    BoardObject.objects.filter(board=board, id=diff["id"]).update(**to_data)
            return True
        
        if diff_type == "update_many":
            for u in diff["updates"]:
                obj = BoardObject.objects.filter(board=board, id=u["id"]).first()
                if obj:
                    from_data = u["to"]
                    if "data" in from_data:
                        new_data = {**obj.data, **from_data["data"]}
                        BoardObject.objects.filter(board=board, id=u["id"]).update(data=new_data)
                    else:
                        BoardObject.objects.filter(board=board, id=u["id"]).update(**from_data)
            return True

        return False

    @database_sync_to_async
    def save_activity(self, data, user, diff):
        from boards.models import Board
        from activity.models import BoardActivity
        try:
            board = Board.objects.get(public_id=self.board_id)
        except Board.DoesNotExist:
            return None
        with transaction.atomic():
            board_locked = Board.objects.select_for_update().get(public_id=self.board_id)
            max_seq = BoardActivity.objects.filter(board=board_locked).aggregate(
                Max("sequence")
            )["sequence__max"] or 0
            return BoardActivity.objects.create(
                board=board_locked,
                user=user,
                action_type=data["type"],
                payload=data,
                diff=diff,
                sequence=max_seq + 1,
            )

    @database_sync_to_async
    def truncate_user_activities_after(self, cursor_sequence: int, user_id: int):
        from boards.models import Board
        from activity.models import BoardActivity
        try:
            board = Board.objects.get(public_id=self.board_id)
        except Board.DoesNotExist:
            return []
        qs = BoardActivity.objects.filter(
            board=board,
            user_id=user_id,
            sequence__gt=cursor_sequence
        )
        deleted_ids = [str(id) for id in qs.values_list("id", flat=True)]
        qs.delete()
        return deleted_ids

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
                id=obj_data["id"], board=board,
                type=obj_data["type"], x=obj_data["x"], y=obj_data["y"],
                width=obj_data.get("width"), height=obj_data.get("height"),
                rotation=obj_data.get("rotation", 0), z_index=obj_data.get("z_index", 0),
                locked=obj_data.get("locked", False), data=obj_data.get("data", {}),
            )

    @database_sync_to_async
    def load_user_undo_stack(self, user_id: int):
        from boards.models import Board
        from activity.models import BoardActivity
        try:
            board = Board.objects.get(public_id=self.board_id)
        except Board.DoesNotExist:
            return []
        activities = BoardActivity.objects.filter(
            board=board,
            user_id=user_id,
            action_type__in=[
                "create_shape", "delete_shape", "delete_many",
                "move_shape", "move_many", "resize_shape", "resize_many",
                "update_color", "update_text", "update_object",
                "bring_forward", "send_back", "bring_to_front", "send_to_back",
                "bold_text", "italic_text", "font_size", "align_text",
                "font_family", "text_color",
            ]
        ).order_by("sequence")[:50]
        return [
            {
                "diff": activity.diff,
                "activity_id": str(activity.id),
                "sequence": activity.sequence,
            }
            for activity in activities
            if activity.diff is not None
        ]
    

    @database_sync_to_async
    def delete_activities_after_sequence(self, sequence: int):
        from boards.models import Board
        from activity.models import BoardActivity
        try:
            board = Board.objects.get(public_id=self.board_id)
        except Board.DoesNotExist:
            return []
        qs = BoardActivity.objects.filter(
            board=board,
            sequence__gt=sequence
        )
        deleted_ids = [str(id) for id in qs.values_list("id", flat=True)]
        qs.delete()
        return deleted_ids
    

    @database_sync_to_async
    def save_restore_activity(self, user):
        from boards.models import Board
        from activity.models import BoardActivity
        try:
            board = Board.objects.get(public_id=self.board_id)
        except Board.DoesNotExist:
            return None
        with transaction.atomic():
            board_locked = Board.objects.select_for_update().get(public_id=self.board_id)
            max_seq = BoardActivity.objects.filter(board=board_locked).aggregate(
                Max("sequence")
            )["sequence__max"] or 0
            return BoardActivity.objects.create(
                board=board_locked,
                user=user,
                action_type="restore",
                payload={},
                diff=None,
                sequence=max_seq + 1,
            )