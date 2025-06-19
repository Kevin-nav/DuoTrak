import uuid
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.partnership import Partnership
from app.api.v1.schemas.partnership import PartnershipCreate, PartnershipUpdate
from app.repositories.base_repository import BaseRepository


class PartnershipRepository(BaseRepository[Partnership, PartnershipCreate, PartnershipUpdate]):
    def __init__(self):
        super().__init__(Partnership)

    async def get_by_users(self, db: AsyncSession, *, user1_id: uuid.UUID, user2_id: uuid.UUID) -> Partnership | None:
        """
        Get a partnership by the two users involved.
        """
        statement = select(self.model).where(
            ((self.model.user1_id == user1_id) & (self.model.user2_id == user2_id)) |
            ((self.model.user1_id == user2_id) & (self.model.user2_id == user1_id))
        )
        result = await db.execute(statement)
        return result.scalar_one_or_none()

    async def get_pending_invitations_for_user(self, db: AsyncSession, *, user_id: uuid.UUID) -> list[Partnership]:
        """
        Get all pending invitations for a specific user (where they are the invitee).
        """
        statement = select(self.model).where(
            (self.model.user2_id == user_id) & (self.model.status == 'pending')
        )
        result = await db.execute(statement)
        return result.scalars().all()


partnership_repo = PartnershipRepository()
