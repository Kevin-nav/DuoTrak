from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from urllib.parse import urlparse

from app.core.config import settings
from app.api.v1.router import api_router
from app.core.logging_config import setup_logging
from app.core.limiter import limiter, key_func
import logging

logger = logging.getLogger(__name__)

# Setup logging
setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Add the rate limiter to the application state
app.state.limiter = limiter

# Custom rate limit exceeded handler
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom handler for rate limit exceeded errors.
    Logs the user ID (if available), IP address, and the endpoint that was hit.
    """
    user_identifier = key_func(request)
    logger.warning(
        f"Rate limit exceeded for identifier: {user_identifier}. "
        f"Path: {request.scope['path']}. "
        f"Detail: {exc.detail}"
    )
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": f"Rate limit exceeded: {exc.detail}"},
    )

app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

def _normalize_origin(url: str | None) -> str | None:
    if not url:
        return None
    parsed = urlparse(url.strip())
    if not parsed.scheme or not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}"


allowed_origins = {
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "https://duotrak.org",
    "https://www.duotrak.org",
}

client_origin = _normalize_origin(getattr(settings, "CLIENT_ORIGIN_URL", None))
if client_origin:
    allowed_origins.add(client_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Health Check"])
async def root():
    return {"message": "Welcome to the DuoTrak API"}

@app.get("/test-rate-limit", tags=["Test"])
@limiter.limit("2/minute")
async def test_rate_limit(request: Request):
    return {"message": "Success"}



# Include all versioned API routers from a single surface definition
app.include_router(api_router, prefix=settings.API_V1_STR)

# ... (keep other routers if any)


