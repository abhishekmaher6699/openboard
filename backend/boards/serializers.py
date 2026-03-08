from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Board


class OwnerSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ["id", "username"]


class BoardSerializer(serializers.ModelSerializer):

    owner = OwnerSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Board
        fields = [
            "public_id",
            "name",
            "owner",
            "invite_code",
            "member_count",
            "created_at",
        ]
        read_only_fields = ["public_id", "invite_code", "created_at"]
    
    def get_member_count(self, obj):
        return obj.members.count() + 1

class JoinBoardSerializer(serializers.Serializer):
    invite_code = serializers.CharField(max_length=6)