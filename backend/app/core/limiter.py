from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings

# Centralized rate limiter instance
limiter = Limiter(key_func=get_remote_address, storage_uri=str(settings.REDIS_URL))
