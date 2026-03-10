from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from .models import BoardObject
from .serializers import BoardObjectSerializer
from boards.models import Board

class BoardObjectViewSet(ModelViewSet):

    serializer_class = BoardObjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        board_id = self.kwargs.get("board_id")

        board = Board.objects.get(public_id=board_id)

        return BoardObject.objects.filter(board=board).order_by("z_index")

    def perform_create(self, serializer):
        board_id = self.kwargs.get("board_id")

        board = Board.objects.get(public_id=board_id)

        serializer.save(
            board=board,
            created_by=self.request.user
        )