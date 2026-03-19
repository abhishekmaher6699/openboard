from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger("board.middleware")


User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        token = AccessToken(token_key)
        user_id = token["user_id"]
        return User.objects.get(id=user_id)
    except Exception as e:
        logger.debug("Failed to get user from token...", e)
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # get token from query string: ws://...?token=xxx
        query_string = scope.get("query_string", b"").decode()
        # print(f"query_string: {query_string}")

        params = dict(p.split("=") for p in query_string.split("&") if "=" in p)
        token = params.get("token")

        print(token)
        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)