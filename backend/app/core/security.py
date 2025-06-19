import json
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings

# Initialize Firebase Admin SDK
try:
    # Check if the path is to a file or if it's the JSON content itself
    if settings.FIREBASE_SERVICE_ACCOUNT_JSON_PATH.strip().startswith('{'):
        creds_json = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON_PATH)
        cred = credentials.Certificate(creds_json)
    else:
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_JSON_PATH)
    
    firebase_admin.initialize_app(cred)
except Exception as e:
    # In a real app, you'd want to log this error.
    print(f"Could not initialize Firebase Admin SDK: {e}")
    # The app can continue running, but auth-dependent endpoints will fail.

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") # We don't have a token URL, but it's required

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Dependency to verify Firebase ID token and get user data."""
    if not firebase_admin._apps:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase Admin SDK not initialized. Cannot authenticate."
        )
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase ID token",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during token verification: {e}",
        )
