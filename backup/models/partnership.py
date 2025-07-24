import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class PartnershipStatus(str, enum.Enum):
    ACTIVE = "active"
    DISSOLVED = "dissolved"

class Partnership(Base):
    __tablename__ = 'partnerships'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user1_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    user2_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    status = Column(Enum(PartnershipStatus), nullable=False, default=PartnershipStatus.ACTIVE)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user1 = relationship("User", foreign_keys=[user1_id], back_populates="partnerships1")
    user2 = relationship("User", foreign_keys=[user2_id], back_populates="partnerships2")
