from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from boards.access import get_accessible_board_or_raise
from boards.models import Board
from .models import BoardActivity
from .serializers import BoardActivitySerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def board_activities(request, public_id):
    try:
        board = get_accessible_board_or_raise(public_id, request.user)
    except Board.DoesNotExist:
        return Response({"detail": "Not found."}, status=404)
    except PermissionDenied as exc:
        return Response({"detail": str(exc)}, status=403)

    limit = int(request.query_params.get("limit", 50))
    activities = BoardActivity.objects.filter(board=board).order_by("sequence", "created_at")
    # get last N
    total = activities.count()
    activities = activities[max(0, total - limit):]
    serializer = BoardActivitySerializer(activities, many=True)
    return Response(serializer.data)
