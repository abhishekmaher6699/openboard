from rest_framework import serializers
from .models import BoardObject


class BoardObjectSerializer(serializers.ModelSerializer):

    class Meta:
        model = BoardObject
        fields = "__all__"
        read_only_fields = [
            "id",
            "board",
            "created_at",
            "updated_at",
            "created_by"
        ]