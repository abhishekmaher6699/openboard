import uuid
from django.db import models
from django.contrib.auth import get_user_model
from boards.models import Board

User = get_user_model()


class BoardActivity(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    board = models.ForeignKey(
        Board,
        on_delete=models.CASCADE,
        related_name="activities"
    )

    user = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL
    )

    action_type = models.CharField(max_length=50)

    # what changed — ids, positions, etc
    payload = models.JSONField(default=dict)

    # full board state at this moment for time-travel
    snapshot = models.JSONField(default=list)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} — {self.action_type} on {self.board}"