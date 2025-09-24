# backend/app/services/user_service.py

import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status

from app.db.models.user import User
from app.db.models.partner_invitation import PartnerInvitation
from app.db.models.partnership import Partnership
from app.schemas.user import UserCreate, UserUpdate, UserRead

from sqlalchemy.orm import selectinload, load_only



class UserService:
    async def has_pending_invitation(self, db: AsyncSession, user: User) -> bool:
        """
        Checks if the user has a pending invitation that they have sent.
        """
        stmt = select(PartnerInvitation).where(
            PartnerInvitation.sender_id == user.id,
            PartnerInvitation.status == 'pending'
        )
        result = await db.execute(stmt)
        return result.scalars().first() is not None
    async def get_user_by_firebase_uid(self, db: AsyncSession, firebase_uid: str):
        """
        Retrieve a user by their Firebase UID, ensuring all columns and badges are loaded.
        """
        stmt = select(User).options(
            selectinload(User.user_badges),
            load_only(
                User.id, User.firebase_uid, User.email, User.full_name, User.account_status,
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
                User.id, User.firebase_uid, User.email, User.full_name, User.account_status,
                User.partnership_status, User.bio, User.profile_picture_url, User.timezone,
                User.notifications_enabled, User.current_streak, User.longest_streak,
                User.total_tasks_completed, User.goals_conquered, User.current_partner_id,
                User.created_at, User.updated_at
            )
        ).filter(User.email == email)
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_user_by_id(self, db: AsyncSession, user_id: int):
        """
        Retrieve a user by their primary key ID, ensuring all columns and badges are loaded.
        """
        stmt = select(User).options(
            selectinload(User.user_badges),
            load_only(
                User.id, User.firebase_uid, User.email, User.full_name, User.account_status,
                User.partnership_status, User.bio, User.profile_picture_url, User.timezone,
                User.notifications_enabled, User.current_streak, User.longest_streak,
                User.total_tasks_completed, User.goals_conquered, User.current_partner_id,
                User.created_at, User.updated_at
            )
        ).filter(User.id == user_id)
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
        # If nickname is provided, update it in the partnership
        if user_in.nickname is not None and db_user.current_partner_id:
            partnership = await self._get_partnership_by_user_id(db, db_user.id)
            if partnership:
                if partnership.user1_id == db_user.id:
                    partnership.user1_nickname = user_in.nickname
                else:
                    partnership.user2_nickname = user_in.nickname
                db.add(partnership)

        await db.commit()
        await db.refresh(db_user)
        return await self._get_user_read(db, db_user)

    async def _get_user_read(self, db: AsyncSession, user: User) -> UserRead:
        partner_full_name: Optional[str] = None
        partner_nickname: Optional[str] = None
        partnership_id: Optional[uuid.UUID] = None

        if user.current_partner_id:
            partner = await self.get_user_by_id(db, user.current_partner_id)
            if partner:
                partner_full_name = partner.full_name
            
            partnership = await self._get_partnership_by_user_id(db, user.id)
            if partnership:
                partnership_id = partnership.id
                if partnership.user1_id == user.id:
                    partner_nickname = partnership.user2_nickname
                else:
                    partner_nickname = partnership.user1_nickname

        user_read_data = {
            **user.__dict__,
            "partner_id": user.current_partner_id,
            "partner_full_name": partner_full_name,
            "partner_nickname": partner_nickname,
            "partnership_id": partnership_id,
            "sent_invitation": await self._get_pending_sent_invitation(db, user.id),
            "received_invitation": await self._get_received_invitation(db, user.email),
            "badges": [{"badge": ub.badge, "earned_at": ub.earned_at} for ub in user.user_badges]
        }
        return UserRead.model_validate(user_read_data)

    async def _get_partnership_by_user_id(self, db: AsyncSession, user_id: uuid.UUID) -> Optional[Partnership]:
        stmt = select(Partnership).where(
            (Partnership.user1_id == user_id) | (Partnership.user2_id == user_id)
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    async def _get_pending_sent_invitation(self, db: AsyncSession, user_id: uuid.UUID) -> Optional[PartnerInvitation]:
        """
        Gets the most recent pending invitation sent by the user.
        """
        stmt = select(PartnerInvitation).where(
            PartnerInvitation.sender_id == user_id,
            PartnerInvitation.status == 'pending'
        ).order_by(PartnerInvitation.created_at.desc())
        result = await db.execute(stmt)
        return result.scalars().first()

    async def _get_received_invitation(self, db: AsyncSession, email: str) -> Optional[PartnerInvitation]:
        """
        Checks for a pending invitation received by the user.
        """
        stmt = select(PartnerInvitation).where(
            PartnerInvitation.receiver_email.ilike(email),
            PartnerInvitation.status == 'pending'
        ).order_by(PartnerInvitation.created_at.desc())
        result = await db.execute(stmt)
        return result.scalars().first()


user_service = UserService()