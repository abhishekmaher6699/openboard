import uuid
from django.db import models
from django.contrib.auth import get_user_model

from boards.models import Board

User = get_user_model()


class BoardObject(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    board = models.ForeignKey(
        Board,
        on_delete=models.CASCADE,
        related_name="board_objects",
        db_index=True
    )

    type = models.CharField(max_length=50)

    x = models.FloatField()
    y = models.FloatField()

    width = models.FloatField(null=True, blank=True)
    height = models.FloatField(null=True, blank=True)

    rotation = models.FloatField(default=0)

    z_index = models.IntegerField(default=0)

    locked = models.BooleanField(default=False)

    data = models.JSONField(default=dict)

    created_by = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)