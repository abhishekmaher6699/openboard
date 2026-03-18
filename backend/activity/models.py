import uuid
from django.db import models
from django.contrib.auth import get_user_model
from boards.models import Board

User = get_user_model()


class BoardActivity(models.Model):

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name="activities")

    user = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)

    action_type = models.CharField(max_length=50)

    payload = models.JSONField(default=dict)

    snapshot = models.JSONField(default=list, null=True, blank=True)

    diff = models.JSONField(null=True, blank=True)

    sequence = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sequence"]

    def __str__(self):
        return f"{self.user} — {self.action_type} on {self.board}"