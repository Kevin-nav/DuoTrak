from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.models.user import User
from app.api.v1.schemas.user import UserCreate, UserUpdate
from app.repositories.base_repository import BaseRepository

class UserRepository(BaseRepository[User, UserCreate, UserUpdate]):
    def __init__(self):
        super().__init__(User)

    async def get_by_email(self, db: AsyncSession, *, email: str) -> Optional[User]:
        result = await db.execute(select(User).filter(User.email == email))
        return result.scalars().first()

    async def get_by_firebase_uid(self, db: AsyncSession, *, firebase_uid: str) -> Optional[User]:
        result = await db.execute(select(User).filter(User.firebase_uid == firebase_uid))
        return result.scalars().first()


user_repo = UserRepository()
