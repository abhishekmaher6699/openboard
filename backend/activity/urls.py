from django.urls import path
from . import views

urlpatterns = [
    path("api/boards/<str:public_id>/activities/", views.board_activities, name="board_activities"),
]