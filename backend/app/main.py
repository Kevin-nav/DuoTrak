from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi_csrf_protect import CsrfProtect
from fastapi_csrf_protect.exceptions import CsrfProtectError

from app.core.config import settings, CsrfProtectSettings
from app.api.v1.api import api_router
from app.core.logging_config import setup_logging
from app.core.limiter import limiter # Import the centralized limiter

# Setup logging
setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Add the rate limiter to the application state and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Set up CORS middleware to allow frontend requests
# In a production environment, you should be more restrictive
# with the allowed origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Allow both hostnames for local dev
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# CSRF Protection
@CsrfProtect.load_config
def get_csrf_config():
    return CsrfProtectSettings()

@app.exception_handler(CsrfProtectError)
def csrf_protect_exception_handler(request: Request, exc: CsrfProtectError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

@app.get("/", tags=["Health Check"])
async def root():
    return {"message": "Welcome to the DuoTrak API"}

# Include the main API router, which will hold all our v1 endpoints
app.include_router(api_router, prefix=settings.API_V1_STR)

from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Depends

@app.get("/health/db", tags=["Health Check"])
async def db_health_check(db: AsyncSession = Depends(get_db)):
    try:
        # A simple query to check the connection
        await db.execute(select(1))
        return {"status": "ok", "message": "Database connection is healthy."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection failed: {str(e)}"
        )

