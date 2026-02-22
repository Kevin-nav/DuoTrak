from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi_csrf_protect import CsrfProtect
from fastapi_csrf_protect.exceptions import CsrfProtectError
from typing import Optional
from pydantic_settings import BaseSettings
import os
from starlette.middleware.base import BaseHTTPMiddleware
import json

from app.core.config import settings
from app.api.v1.router import api_router
from app.core.logging_config import setup_logging
from app.core.limiter import limiter, key_func
import firebase_admin
from firebase_admin import credentials
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_JSON_PATH)
        firebase_admin.initialize_app(cred)
    except Exception as e:
        # This will catch errors like the service account file not being found
        # and prevent the app from starting.
        print(f"CRITICAL: Failed to initialize Firebase Admin SDK: {e}")
        raise

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

# Set up CORS middleware
# Define allowed origins for local development to handle both localhost and 127.0.0.1
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# In a production environment, you would fetch this from settings
# if os.environ.get("ENV") == "production":
#     allowed_origins = [settings.CLIENT_URL]

# Set up CORS middleware
# Define allowed origins for local development to handle both localhost and 127.0.0.1
allowed_origins = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
]

# In a production environment, you would fetch this from settings
# if os.environ.get("ENV") == "production":
#     allowed_origins = [settings.CLIENT_URL]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@CsrfProtect.load_config
def get_csrf_config():
    return [("secret_key", settings.SECRET_KEY)]


# CSRF Exception Handler
@app.exception_handler(CsrfProtectError)
def csrf_protect_exception_handler(request: Request, exc: CsrfProtectError):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={
            "detail": "CSRF token validation failed",
            "error": exc.message,
            "type": "csrf_error"
        }
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


