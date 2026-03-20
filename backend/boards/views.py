from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from board_objects.models import BoardObject

from .models import Board
from .serializers import BoardSerializer, JoinBoardSerializer
from .permissions import IsOwner


class BoardViewSet(viewsets.ModelViewSet):

    serializer_class = BoardSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "public_id"

    def get_queryset(self):
        user = self.request.user
        return Board.objects.filter(
            Q(owner=user) | Q(members=user)
        ).distinct()

    def get_permissions(self):
        if self.action == "destroy":
            permission_classes = [IsAuthenticated, IsOwner]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        board = serializer.save(owner=self.request.user)

        BoardObject.objects.create(
            board=board,
            created_by=self.request.user,
            type="rectangle",
            x=-400,
            y=-300,
            width=800,
            height=600,
            z_index=0,
            data={"fill": "0xd1d5db", "text": ""},
        )

        BoardObject.objects.create(
            board=board,
            created_by=self.request.user,
            type="sticky",
            x=-100,
            y=-100,
            width=200,
            height=200,
            z_index=1000,
            data={"fill": "0xffd700", "text": "Welcome!"},
        )

    @action(detail=False, methods=["post"])
    def join(self, request):
        serializer = JoinBoardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data["invite_code"]

        try:
            board = Board.objects.get(invite_code=code)
        except Board.DoesNotExist:
            return Response(
                {"detail": "Invalid invite code"},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.user == board.owner or request.user in board.members.all():
            return Response(
                {"detail": "Already a member"},
                status=status.HTTP_400_BAD_REQUEST
            )

        board.members.add(request.user)
        return Response(BoardSerializer(board).data)

    @action(detail=True, methods=["post"])
    def leave(self, request, *args, **kwargs):
        board = self.get_object()

        if request.user == board.owner:
            return Response(
                {"detail": "Owner cannot leave board"},
                status=status.HTTP_400_BAD_REQUEST
            )

        board.members.remove(request.user)
        return Response({"detail": "Left board"})