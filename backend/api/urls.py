from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("auth/", include("accounts.urls")),
    path("", include("boards.urls")),
]
