from rest_framework.routers import DefaultRouter
from .views import BoardObjectViewSet

router = DefaultRouter()

router.register(
    r"boards/(?P<board_id>[^/.]+)/objects",
    BoardObjectViewSet,
    basename="board-objects"
)

urlpatterns = router.urls