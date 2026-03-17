from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from boards.models import Board
from .models import BoardActivity
from .serializers import BoardActivitySerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def board_activities(request, public_id):
    try:
        board = Board.objects.get(public_id=public_id)
    except Board.DoesNotExist:
        return Response({"detail": "Not found."}, status=404)

    activities = BoardActivity.objects.filter(board=board).order_by("-created_at")[:20]
    serializer = BoardActivitySerializer(activities, many=True)
    # return in chronological order for the frontend
    return Response(list(reversed(serializer.data)))