from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from fastapi_csrf_protect import CsrfProtect
from app.api.v1.endpoints import auth, partner_invitations, users, storage, goals, chat

api_router = APIRouter()

@api_router.get("/auth/csrf", tags=["Authentication"])
def get_csrf_token(csrf_protect: CsrfProtect = Depends()):
    """
    Generates a CSRF token and sets it in a cookie.
    The frontend can call this endpoint to get the token cookie.
    """
    response = JSONResponse(status_code=200, content={'detail': 'CSRF cookie set'})
    # The CsrfProtect library expects a token to be generated first.
    # The set_csrf_cookie method takes the signed token and the response object.
    _, signed_token = csrf_protect.generate_csrf_tokens()
    csrf_protect.set_csrf_cookie(signed_token, response)
    return response

# Include the authentication router
# All routes from auth.py will be prefixed with what's defined here
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Include the users router
api_router.include_router(users.router, prefix="/users", tags=["Users"])

# Include partner invitations router
api_router.include_router(
    partner_invitations.router,
    prefix="/partner-invitations",
    tags=["Partner Invitations"]
)

# Include goals router
api_router.include_router(
    goals.router,
    prefix="/goals",
    tags=["Goals"]
)

# Include storage router
api_router.include_router(storage.router, prefix="/storage", tags=["Storage"])

# Include chat router
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])