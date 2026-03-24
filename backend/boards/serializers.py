from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Board, BoardJoinRequest


class OwnerSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ["id", "username"]


class BoardJoinRequestSerializer(serializers.ModelSerializer):
    user = OwnerSerializer(read_only=True)

    class Meta:
        model = BoardJoinRequest
        fields = ["id", "user", "created_at"]


class BoardSerializer(serializers.ModelSerializer):

    owner = OwnerSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    pending_request_count = serializers.SerializerMethodField()
    pending_requests = serializers.SerializerMethodField()

    class Meta:
        model = Board
        fields = [
            "public_id",
            "name",
            "owner",
            "invite_code",
            "member_count",
            "pending_request_count",
            "pending_requests",
            "created_at",
        ]
        read_only_fields = ["public_id", "invite_code", "created_at"]
    
    def get_member_count(self, obj):
        return obj.members.count() + 1

    def get_pending_request_count(self, obj):
        request = self.context.get("request")
        if not request or request.user != obj.owner:
            return 0
        return obj.join_requests.count()

    def get_pending_requests(self, obj):
        request = self.context.get("request")
        if not request or request.user != obj.owner:
            return []
        join_requests = obj.join_requests.select_related("user").all()
        return BoardJoinRequestSerializer(join_requests, many=True).data

class JoinBoardSerializer(serializers.Serializer):
    invite_code = serializers.CharField(max_length=6)
