from rest_framework.routers import DefaultRouter
from .views import BoardViewSet

router = DefaultRouter()
router.register(r"boards", BoardViewSet, basename="boards")

urlpatterns = router.urls