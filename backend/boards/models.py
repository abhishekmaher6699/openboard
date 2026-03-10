import uuid
from django.db import models
from django.contrib.auth.models import User


def generate_public_id():
    return f"b_{uuid.uuid4().hex[:10]}"


def generate_invite_code():
    return uuid.uuid4().hex[:6].upper()


class Board(models.Model):
    
    public_id = models.CharField(
        max_length=20,
        unique=True,
        default=generate_public_id,
        editable=False
    )

    name = models.CharField(max_length=255)

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="owned_boards"
    )

    members = models.ManyToManyField(
        User,
        related_name="boards",
        blank=True
    )

    invite_code = models.CharField(
        max_length=6,
        unique=True,
        default=generate_invite_code
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    

