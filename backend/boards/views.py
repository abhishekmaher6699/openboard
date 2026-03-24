from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from board_objects.models import BoardObject
from activity.models import BoardActivity

from .access import accessible_boards_for_user
from .models import Board, BoardJoinRequest
from .serializers import BoardSerializer, JoinBoardSerializer
from .permissions import IsOwner


class BoardViewSet(viewsets.ModelViewSet):

    serializer_class = BoardSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "public_id"

    def get_queryset(self):
        return accessible_boards_for_user(self.request.user)

    def get_permissions(self):
        if self.action == "destroy":
            permission_classes = [IsAuthenticated, IsOwner]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]


    def perform_create(self, serializer):
        board = serializer.save(owner=self.request.user)

        rect = BoardObject.objects.create(
            board=board,
            created_by=self.request.user,
            type="rectangle",
            x=-400, y=-300,
            width=800, height=600,
            z_index=0,
            data={"fill": "0xd1d5db", "text": ""},
        )

        sticky = BoardObject.objects.create(
            board=board,
            created_by=self.request.user,
            type="sticky",
            x=-100, y=-100,
            width=200, height=200,
            z_index=1000,
            data={"fill": "0xffd700", "text": "Welcome!"},
        )

        # save create activities so replay works correctly
        def obj_data(obj):
            return {
                "id": str(obj.id), "type": obj.type,
                "x": obj.x, "y": obj.y,
                "width": obj.width, "height": obj.height,
                "rotation": 0, "z_index": obj.z_index,
                "locked": False, "data": obj.data,
            }

        BoardActivity.objects.create(
            board=board, user=self.request.user,
            action_type="create_shape",
            payload={}, sequence=1,
            diff={"type": "create", "object": obj_data(rect)},
        )

        BoardActivity.objects.create(
            board=board, user=self.request.user,
            action_type="create_shape",
            payload={}, sequence=2,
            diff={"type": "create", "object": obj_data(sticky)},
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

        join_request, created = BoardJoinRequest.objects.get_or_create(
            board=board,
            user=request.user,
        )
        if not created:
            return Response(
                {"detail": "Approval request already pending"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "detail": "Join request sent. The board owner must approve it before you can access the board.",
                "board_name": board.name,
                "public_id": board.public_id,
            },
            status=status.HTTP_202_ACCEPTED,
        )

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

    @action(detail=True, methods=["get"], url_path="join-requests")
    def join_requests(self, request, *args, **kwargs):
        board = self.get_object()

        if request.user != board.owner:
            return Response(
                {"detail": "Only the owner can view join requests"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(board)
        return Response(
            {
                "pending_request_count": serializer.data["pending_request_count"],
                "pending_requests": serializer.data["pending_requests"],
            }
        )

    @action(detail=True, methods=["post"], url_path="approve/(?P<user_id>[^/.]+)")
    def approve(self, request, public_id=None, user_id=None):
        board = self.get_object()

        if request.user != board.owner:
            return Response(
                {"detail": "Only the owner can approve join requests"},
                status=status.HTTP_403_FORBIDDEN,
            )

        join_request = BoardJoinRequest.objects.filter(
            board=board,
            user_id=user_id,
        ).first()
        if not join_request:
            return Response(
                {"detail": "Join request not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        board.members.add(join_request.user)
        join_request.delete()

        serializer = self.get_serializer(board)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="reject/(?P<user_id>[^/.]+)")
    def reject(self, request, public_id=None, user_id=None):
        board = self.get_object()

        if request.user != board.owner:
            return Response(
                {"detail": "Only the owner can reject join requests"},
                status=status.HTTP_403_FORBIDDEN,
            )

        deleted, _ = BoardJoinRequest.objects.filter(
            board=board,
            user_id=user_id,
        ).delete()
        if not deleted:
            return Response(
                {"detail": "Join request not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(board)
        return Response(serializer.data)
    
    @action(detail=True, methods=["post"], url_path="kick/(?P<user_id>[^/.]+)")
    def kick(self, request, public_id=None, user_id=None):
        board = self.get_object()

        if request.user != board.owner:
            return Response(
                {"detail": "Only the owner can kick members"},
                status=status.HTTP_403_FORBIDDEN
            )

        from django.contrib.auth.models import User
        try:
            user_to_kick = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user_to_kick == board.owner:
            return Response({"detail": "Cannot kick the owner"}, status=status.HTTP_400_BAD_REQUEST)

        if user_to_kick not in board.members.all():
            return Response({"detail": "User is not a member"}, status=status.HTTP_400_BAD_REQUEST)

        board.members.remove(user_to_kick)
        return Response({"detail": "User kicked"})
