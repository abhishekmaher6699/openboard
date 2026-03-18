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

    limit = int(request.query_params.get("limit", 50))
    activities = BoardActivity.objects.filter(board=board).order_by("sequence", "created_at")
    # get last N
    total = activities.count()
    activities = activities[max(0, total - limit):]
    serializer = BoardActivitySerializer(activities, many=True)
    return Response(serializer.data)