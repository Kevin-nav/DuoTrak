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
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.goals import router as goals_router
from app.core.logging_config import setup_logging
from app.core.limiter import limiter
import firebase_admin
from firebase_admin import credentials

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

# Add the rate limiter to the application state and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Set up CORS middleware
# Set up CORS middleware
# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://localhost:3000"],
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

# Include the authentication router
app.include_router(auth_router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(users_router, prefix="/api/v1/users", tags=["users"])
app.include_router(goals_router, prefix="/api/v1/goals", tags=["goals"])

# ... (keep other routers if any)


