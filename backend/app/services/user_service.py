# backend/app/services/user_service.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status

from app.db.models.user import User
from app.schemas.user import UserCreate, UserUpdate

from sqlalchemy.orm import selectinload, load_only


class UserService:
    async def get_user_by_firebase_uid(self, db: AsyncSession, firebase_uid: str):
        """
        Retrieve a user by their Firebase UID, ensuring all columns and badges are loaded.
        """
        stmt = select(User).options(
            selectinload(User.user_badges),
            load_only(
                User.id, User.firebase_uid, User.email, User.full_name, User.onboarding_complete,
                User.partnership_status, User.bio, User.profile_picture_url, User.timezone,
                User.notifications_enabled, User.current_streak, User.longest_streak,
                User.total_tasks_completed, User.goals_conquered, User.current_partner_id,
                User.created_at, User.updated_at
            )
        ).filter(User.firebase_uid == firebase_uid)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_user_by_email(self, db: AsyncSession, email: str):
        """
        Retrieve a user by their email address, ensuring all columns and badges are loaded.
        """
        stmt = select(User).options(
            selectinload(User.user_badges),
            load_only(
                User.id, User.firebase_uid, User.email, User.full_name, User.onboarding_complete,
                User.partnership_status, User.bio, User.profile_picture_url, User.timezone,
                User.notifications_enabled, User.current_streak, User.longest_streak,
                User.total_tasks_completed, User.goals_conquered, User.current_partner_id,
                User.created_at, User.updated_at
            )
        ).filter(User.email == email)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def sync_user_profile(self, db: AsyncSession, *, user_in: UserCreate) -> User:
        """
        Synchronizes a user profile from a Firebase ID token.
        
        - If user with firebase_uid exists, return user.
        - If not, check if email is already registered with a different method.
        - If email is registered, raise a 409 Conflict error.
        - Otherwise, create a new user.
        """
        # 1. Check if user already exists with this Firebase UID
        db_user = await self.get_user_by_firebase_uid(db, firebase_uid=user_in.firebase_uid)
        if db_user:
            return db_user

        # 2. If not, check if the email is already in use by another account
        existing_user_with_email = await self.get_user_by_email(db, email=user_in.email)
        if existing_user_with_email:
            # This email is registered, but the firebase_uid does not match.
            # This is the account conflict scenario we planned for.
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email is already registered with a different authentication method. Please use the original sign-in method.",
            )

        # 3. If no conflicts, create a new user record
        db_user = User(
            firebase_uid=user_in.firebase_uid,
            email=user_in.email,
            full_name=user_in.full_name
            # Other fields will use the defaults set in the model/database
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user, attribute_names=[
            "timezone", 
            "notifications_enabled", 
            "current_streak", 
            "longest_streak", 
            "total_tasks_completed", 
            "goals_conquered"
        ])
        return db_user

    async def update_user(self, db: AsyncSession, user_id: int, user_in: UserUpdate) -> User:
        """
        Updates an existing user's profile information.
        """
        db_user = await db.get(User, user_id)
        if not db_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        for field, value in user_in.model_dump(exclude_unset=True).items():
            setattr(db_user, field, value)

        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user


user_service = UserService()