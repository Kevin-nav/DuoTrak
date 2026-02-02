# backend/app/api/v1/auth.py - Enhanced authentication endpoints
from fastapi import APIRouter, HTTPException, Response, Request, Depends, status
from fastapi.responses import JSONResponse
from fastapi_csrf_protect import CsrfProtect
from pydantic import BaseModel
import firebase_admin
from firebase_admin import auth as firebase_auth
from datetime import datetime, timedelta, timezone
import jwt
import secrets
from typing import Optional
import httpx

from app.core.config import settings
from app.db.session import get_db
from app.services.user_service import user_service
from app.schemas.user import UserCreate, UserRead
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.limiter import limiter


from starlette.datastructures import URL
import logging

router = APIRouter()
logger = logging.getLogger(__name__)



# Pydantic models
class LoginRequest(BaseModel):
    firebase_token: str

class SessionResponse(BaseModel):
    user: dict
    expires_at: datetime
    csrf_token: str

class RefreshRequest(BaseModel):
    refresh_token: str

# Configuration
REFRESH_COOKIE_NAME = "__refresh"
CSRF_COOKIE_NAME = "csrf_token"
SESSION_DURATION = timedelta(hours=1)  # Shorter session duration
REFRESH_DURATION = timedelta(days=7)   # Longer refresh duration

async def verify_firebase_token(token: str) -> dict:
    """Verify Firebase ID token and return user data"""
    try:
        # Add a clock skew tolerance and check for revoked tokens
        decoded_token = firebase_auth.verify_id_token(
            token, 
            check_revoked=True,
            clock_skew_seconds=15
        )
        return {
            'uid': decoded_token['uid'],
            'email': decoded_token.get('email'),
            'email_verified': decoded_token.get('email_verified', False),
            'name': decoded_token.get('name'),
            'picture': decoded_token.get('picture')
        }
    except Exception as e:
        # Log the specific Firebase error for better debugging
        logger.error(f"Firebase token verification failed with error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase token: {str(e)}"
        )

def create_session_token(user_data: dict) -> tuple[str, datetime]:
    """Create a JWT session token"""
    expires_at = datetime.now(timezone.utc) + SESSION_DURATION
    payload = {
        'uid': str(user_data['id']), # Use the database UUID as the primary identifier
        'email': user_data['email'],
        'exp': expires_at,
        'iat': datetime.now(timezone.utc),
        'type': 'session'
    }
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token, expires_at

def create_refresh_token(user_uid: str) -> tuple[str, datetime]:
    """Create a refresh token"""
    expires_at = datetime.now(timezone.utc) + REFRESH_DURATION
    payload = {
        'uid': user_uid,
        'exp': expires_at,
        'iat': datetime.now(timezone.utc),
        'type': 'refresh',
        'jti': secrets.token_urlsafe(32)  # Unique token ID for revocation
    }
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token, expires_at

async def sync_user_profile(db: AsyncSession, user_data: dict) -> UserRead:
    """Sync user profile with your database and return the full user object."""
    logger.info(f"Syncing profile for firebase_uid: {user_data.get('uid')}")
    user_in = UserCreate(
        firebase_uid=user_data['uid'],
        email=user_data.get('email'),
        full_name=user_data.get('name')
    )
    db_user = await user_service.sync_user_profile(db=db, user_in=user_in)
    logger.info(f"User synced, ID: {db_user.id}. Attempting to serialize with UserRead.")
    try:
        user_read = UserRead.from_orm(db_user)
        logger.info("Serialization successful.")
        return user_read
    except Exception as e:
        logger.exception("Pydantic serialization failed!")
        # Re-raise the exception to let FastAPI handle it
        raise e


# Request model for internal profile sync endpoint
class VerifyAndSyncProfileRequest(BaseModel):
    firebase_uid: str
    email: str | None = None
    full_name: str | None = None
    invitation_token: str | None = None


class VerifyAndSyncProfileResponse(BaseModel):
    user: dict
    account_status: str
    has_pending_invitation: bool


@router.post("/verify-and-sync-profile", response_model=VerifyAndSyncProfileResponse)
async def verify_and_sync_profile(
    request: Request,
    body: VerifyAndSyncProfileRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Internal endpoint for Next.js frontend to sync user profile after Firebase authentication.
    Protected by internal API key - not for direct client use.
    """
    # Verify internal API key
    api_key = request.headers.get("X-Internal-API-Key")
    if not api_key or api_key != settings.INTERNAL_API_SECRET:
        logger.warning("Invalid or missing internal API key for verify-and-sync-profile")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing internal API key"
        )
    
    logger.info(f"[verify-and-sync-profile] Processing for firebase_uid: {body.firebase_uid}")
    
    try:
        # Build user data from request
        user_data = {
            'uid': body.firebase_uid,
            'email': body.email,
            'name': body.full_name,
        }
        
        # Sync user profile in database
        db_user = await sync_user_profile(db, user_data)
        
        # Check for pending invitations
        has_pending = await user_service.has_pending_invitation(db, db_user)
        
        logger.info(f"[verify-and-sync-profile] Successfully synced user. Account status: {db_user.account_status}")
        
        return VerifyAndSyncProfileResponse(
            user=db_user.model_dump(),
            account_status=db_user.account_status.value if hasattr(db_user.account_status, 'value') else str(db_user.account_status),
            has_pending_invitation=has_pending
        )
        
    except Exception as e:
        logger.error(f"[verify-and-sync-profile] Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync user profile: {str(e)}"
        )


@router.post("/session-login", response_model=SessionResponse)
@limiter.limit("5/minute")
async def session_login(
    request: Request,
    login_request: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
    csrf_protect: CsrfProtect = Depends()
):
    """
    Atomic session login endpoint.
    This now dynamically sets the cookie domain based on the request's origin
    to support cross-domain authentication during development and in production.
    """
    try:
        # 1. Verify Firebase token
        user_data = await verify_firebase_token(login_request.firebase_token)
    except HTTPException as e:
        raise e

    try:
        # 2. Sync user profile in database
        db_user = await sync_user_profile(db, user_data)
        
        # 3. Create session and refresh tokens
        session_token, session_expires = create_session_token(db_user.model_dump())
        refresh_token, refresh_expires = create_refresh_token(user_data['uid'])
        
        # 4. Generate CSRF tokens
        unsigned_token, signed_token = csrf_protect.generate_csrf_tokens()

        # 5. Dynamically determine cookie domain from request origin
        origin = request.headers.get('origin')
        cookie_domain = None
        if origin:
            origin_url = URL(origin)
            cookie_domain = origin_url.hostname
            # For production, you might want to add more validation here
            # to ensure the origin is one of your allowed client domains.

        # 6. Set secure cookies with the dynamic domain
        response.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=session_token,
            expires=session_expires,
            httponly=True,
            secure=True,
            samesite='lax',
            path='/',
            domain=cookie_domain
        )
        
        response.set_cookie(
            key=REFRESH_COOKIE_NAME,
            value=refresh_token,
            expires=refresh_expires,
            httponly=True,
            secure=True,
            samesite='lax',
            path='/api/v1/auth',
            domain=cookie_domain
        )
        
        response.set_cookie(
            key=CSRF_COOKIE_NAME,
            value=signed_token,
            expires=session_expires,
            httponly=False,
            secure=True,
            samesite='lax',
            path='/',
            domain=cookie_domain
        )
        
        return SessionResponse(
            user=db_user.model_dump(),
            expires_at=session_expires,
            csrf_token=unsigned_token
        )
        
    except Exception as e:
        logger.error(f"Error in session_login after token verification: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/verify-session")
async def verify_session(request: Request):
    """
    Verify session token - used by middleware and frontend
    """
    logger.info("Attempting to verify session...")
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    
    if not session_token:
        logger.warning("No session token found in cookies.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session token provided"
        )
    
    try:
        logger.info(f"Session token found: {session_token[:15]}...")
        # Verify JWT token
        payload = jwt.decode(session_token, settings.SECRET_KEY, algorithms=["HS256"])
        logger.info(f"JWT decoded successfully for UID: {payload.get('uid')}")
        
        if payload.get('type') != 'session':
            logger.error(f"Invalid token type: {payload.get('type')}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        response_data = {
            'valid': True,
            'uid': payload['uid'],
            'email': payload['email'],
            'expires_at': datetime.fromtimestamp(payload['exp'], tz=timezone.utc)
        }
        logger.info("Session verification successful.")
        return response_data
        
    except jwt.ExpiredSignatureError:
        logger.warning("Session token has expired.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token"
        )
    except Exception as e:
        logger.exception("An unexpected error occurred during session verification.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred."
        )

@router.post("/refresh-session")
@limiter.limit("10/minute")
async def refresh_session(
    request: Request,
    response: Response,
    csrf_protect: CsrfProtect = Depends()
):
    """
    Refresh session using refresh token
    """
    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided"
        )
    
    try:
        # Verify refresh token
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=["HS256"])
        
        if payload.get('type') != 'refresh':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        # Get user data (you might want to fetch from DB here)
        user_data = {'uid': payload['uid'], 'email': ''} # Minimal data for refresh
        
        # Create new session token
        session_token, session_expires = create_session_token(user_data)
        unsigned_token, signed_token = csrf_protect.generate_csrf_tokens()
        
        # Set new session cookie
        response.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=session_token,
            expires=session_expires,
            httponly=True,
            secure=True,
            samesite='lax',
            path='/'
        )
        
        response.set_cookie(
            key=CSRF_COOKIE_NAME,
            value=signed_token,
            expires=session_expires,
            httponly=False,
            secure=True,
            samesite='lax',
            path='/'
        )
        
        return {
            'message': 'Session refreshed',
            'expires_at': session_expires,
            'csrf_token': unsigned_token
        }
        
    except jwt.ExpiredSignatureError:
        # Clear expired refresh token
        response.delete_cookie(REFRESH_COOKIE_NAME, path='/api/v1/auth')
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.post("/logout")
async def logout(response: Response):
    """
    Logout endpoint - clears all auth cookies
    """
    response.delete_cookie(settings.SESSION_COOKIE_NAME, path='/')
    response.delete_cookie(REFRESH_COOKIE_NAME, path='/api/v1/auth')
    response.delete_cookie(CSRF_COOKIE_NAME, path='/')
    
    return {'message': 'Logged out successfully'}

@router.get("/csrf-token")
def get_csrf_token(csrf_protect: CsrfProtect = Depends()):
    """
    Get CSRF token for forms that need it
    """
    unsigned_token, _ = csrf_protect.generate_csrf_tokens()
    return {'csrf_token': unsigned_token}