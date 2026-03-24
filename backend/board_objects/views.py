from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound

from .models import BoardObject
from .serializers import BoardObjectSerializer
from boards.access import get_accessible_board_or_raise
from boards.models import Board

class BoardObjectViewSet(ModelViewSet):

    serializer_class = BoardObjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        board_id = self.kwargs.get("board_id")

        try:
            board = get_accessible_board_or_raise(board_id, self.request.user)
        except Board.DoesNotExist:
            raise NotFound("Board not found.")

        return BoardObject.objects.filter(board=board).order_by("z_index")

    def perform_create(self, serializer):
        board_id = self.kwargs.get("board_id")

        try:
            board = get_accessible_board_or_raise(board_id, self.request.user)
        except Board.DoesNotExist:
            raise NotFound("Board not found.")

        serializer.save(
            board=board,
            created_by=self.request.user
        )
