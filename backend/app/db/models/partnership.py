import uuid
from sqlalchemy import Column, ForeignKey, UniqueConstraint, CheckConstraint, TIMESTAMP, String, DateTime, text
from sqlalchemy.dialects.postgresql import ENUM, UUID

from sqlalchemy.sql import func

from app.db.base import Base
from app.schemas import PartnershipStatus

class Partnership(Base):
    __tablename__ = 'partnerships'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user1_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    user2_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    user1_nickname = Column(String(100), nullable=True)
    user2_nickname = Column(String(100), nullable=True)
    status = Column(String, default='active')
    start_date = Column(DateTime(timezone=True), server_default=text('now()'))
    end_date = Column(DateTime(timezone=True), nullable=True)
    start_date = Column(TIMESTAMP(timezone=True), nullable=False)
    status = Column(
        ENUM(PartnershipStatus, name="partnership_status_enum", create_type=False),
        nullable=False
    )

    # Relationships to User are configured in app/db/models/__init__.py

    created_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint('user1_id', 'user2_id', name='uq_user_partnership'),
        CheckConstraint('user1_id < user2_id', name='check_user_order'),
    )
