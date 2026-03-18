from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import BoardActivity

User = get_user_model()


class ActivityUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class BoardActivitySerializer(serializers.ModelSerializer):
    user = ActivityUserSerializer(read_only=True)

    class Meta:
        model = BoardActivity
        fields = [
            "id",
            "user",
            "action_type",
            "payload",
            "snapshot",
            "diff",
            "sequence",
            "created_at",
        ]