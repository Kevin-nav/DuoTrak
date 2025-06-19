from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import user_repo
from app.api.v1.schemas.user import UserCreate
from app.db.models.user import User

class UserService:
    async def sync_user_profile(self, db: AsyncSession, *, firebase_user: dict) -> User:
        """
        Synchronizes a user's profile from Firebase to the local database.
        If the user exists, it updates it. If not, it creates it.
        """
        firebase_uid = firebase_user["uid"]
        email = firebase_user.get("email")

        if not email:
            # Handle cases where email might not be present, though it should be for DuoTrak
            raise ValueError("Email not found in Firebase token.")

        db_user = await user_repo.get_by_firebase_uid(db, firebase_uid=firebase_uid)

        if db_user:
            # If user exists, we can optionally update their profile info here
            # For now, just return the existing user
            return db_user
        else:
            # If user does not exist, create them
            username = firebase_user.get("username")
            user_in = UserCreate(firebase_uid=firebase_uid, email=email, username=username)
            return await user_repo.create(db, obj_in=user_in)

user_service = UserService()
