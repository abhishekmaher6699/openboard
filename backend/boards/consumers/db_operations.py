from channels.db import database_sync_to_async
from django.db import transaction
from django.db.models import Max


@database_sync_to_async
def apply_inverse_diff(board_id: str, diff: dict):
    from boards.models import Board
    from board_objects.models import BoardObject
    try:
        board = Board.objects.get(public_id=board_id)
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
                BoardObject.objects.filter(board=board, id=diff["id"]).update(
                    data={**obj.data, **from_data["data"]}
                )
            else:
                BoardObject.objects.filter(board=board, id=diff["id"]).update(**from_data)
        return {"type": "update", "id": diff["id"], "from": diff["to"], "to": diff["from"]}

    if diff_type == "update_many":
        for u in diff["updates"]:
            obj = BoardObject.objects.filter(board=board, id=u["id"]).first()
            if obj:
                from_data = u["from"]
                if "data" in from_data:
                    BoardObject.objects.filter(board=board, id=u["id"]).update(
                        data={**obj.data, **from_data["data"]}
                    )
                else:
                    BoardObject.objects.filter(board=board, id=u["id"]).update(**from_data)
        return {
            "type": "update_many",
            "updates": [{"id": u["id"], "from": u["to"], "to": u["from"]} for u in diff["updates"]]
        }

    return None


@database_sync_to_async
def apply_diff_to_db(board_id: str, diff: dict):
    from boards.models import Board
    from board_objects.models import BoardObject
    try:
        board = Board.objects.get(public_id=board_id)
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
        BoardObject.objects.filter(board=board, id__in=[o["id"] for o in diff["objects"]]).delete()
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
                BoardObject.objects.filter(board=board, id=diff["id"]).update(
                    data={**obj.data, **to_data["data"]}
                )
            else:
                BoardObject.objects.filter(board=board, id=diff["id"]).update(**to_data)
        return True

    if diff_type == "update_many":
        for u in diff["updates"]:
            obj = BoardObject.objects.filter(board=board, id=u["id"]).first()
            if obj:
                to_data = u["to"]
                if "data" in to_data:
                    BoardObject.objects.filter(board=board, id=u["id"]).update(
                        data={**obj.data, **to_data["data"]}
                    )
                else:
                    BoardObject.objects.filter(board=board, id=u["id"]).update(**to_data)
        return True

    return False


@database_sync_to_async
def apply_snapshot_to_db(board_id: str, snapshot: list):
    from boards.models import Board
    from board_objects.models import BoardObject
    try:
        board = Board.objects.get(public_id=board_id)
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
def save_activity(board_id: str, data: dict, user, diff: dict):
    from boards.models import Board
    from activity.models import BoardActivity
    try:
        board = Board.objects.get(public_id=board_id)
    except Board.DoesNotExist:
        return None
    with transaction.atomic():
        board_locked = Board.objects.select_for_update().get(public_id=board_id)
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
def save_restore_activity(board_id: str, user):
    from boards.models import Board
    from activity.models import BoardActivity
    try:
        board = Board.objects.get(public_id=board_id)
    except Board.DoesNotExist:
        return None
    with transaction.atomic():
        board_locked = Board.objects.select_for_update().get(public_id=board_id)
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


@database_sync_to_async
def truncate_user_activities_after(board_id: str, cursor_sequence: int, user_id: int):
    from boards.models import Board
    from activity.models import BoardActivity
    try:
        board = Board.objects.get(public_id=board_id)
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
def delete_activities_after_sequence(board_id: str, sequence: int):
    from boards.models import Board
    from activity.models import BoardActivity
    try:
        board = Board.objects.get(public_id=board_id)
    except Board.DoesNotExist:
        return []
    qs = BoardActivity.objects.filter(board=board, sequence__gt=sequence)
    deleted_ids = [str(id) for id in qs.values_list("id", flat=True)]
    qs.delete()
    return deleted_ids


@database_sync_to_async
def load_user_undo_stack(board_id: str, user_id: int):
    from boards.models import Board
    from activity.models import BoardActivity
    try:
        board = Board.objects.get(public_id=board_id)
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
            "font_family", "text_color", "update_object_many"
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
