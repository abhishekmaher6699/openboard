from django.db.models import Q
from rest_framework.exceptions import PermissionDenied

from .models import Board


def accessible_boards_for_user(user):
    return Board.objects.filter(Q(owner=user) | Q(members=user)).distinct()


def user_can_access_board(user, board):
    if not user or not user.is_authenticated:
        return False
    if board.owner_id == user.id:
        return True
    return board.members.filter(id=user.id).exists()


def get_accessible_board_or_raise(public_id, user):
    try:
        board = Board.objects.get(public_id=public_id)
    except Board.DoesNotExist as exc:
        raise Board.DoesNotExist from exc

    if not user_can_access_board(user, board):
        raise PermissionDenied("You do not have access to this board.")

    return board
