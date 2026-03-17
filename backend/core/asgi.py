import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
import boards.routing
from core.middleware import JWTAuthMiddleware

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(
        URLRouter(boards.routing.websocket_urlpatterns)
    ),
})