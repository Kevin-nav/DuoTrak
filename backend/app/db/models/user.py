# backend/app/db/models/user.py

import uuid
from typing import TYPE_CHECKING, List, Optional

import sqlalchemy as sa
from sqlalchemy import Boolean, Column, Enum, ForeignKey, String, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.schemas.user import AccountStatus

if TYPE_CHECKING:
    from .partner_invitation import PartnerInvitation  # noqa: F401
    from .partnership import Partnership  # noqa: F401
    from .goal import Goal

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True)
    account_status = Column(
    Enum('AWAITING_ONBOARDING', 'AWAITING_PARTNERSHIP', 'ACTIVE', name='accountstatus', create_type=False),
    default='AWAITING_ONBOARDING',
    nullable=False
)
    partnership_status = Column(
    Enum('active', 'pending', 'no_partner', name='partnershipstatus', create_type=False),
    default='no_partner',
    nullable=False
)
    
    # Profile fields
    bio = Column(String(255), nullable=True)
    profile_picture_url = Column(sa.Text(), nullable=True)
    timezone = Column(String(100), server_default='UTC', default='UTC', nullable=False)
    notifications_enabled = Column(Boolean, server_default=sa.text('true'), default=True, nullable=False)
    current_streak = Column(sa.Integer(), server_default='0', default=0, nullable=False)
    longest_streak = Column(sa.Integer(), server_default='0', default=0, nullable=False)
    total_tasks_completed = Column(sa.Integer(), server_default='0', default=0, nullable=False)
    goals_conquered = Column(sa.Integer(), server_default='0', default=0, nullable=False)

    # Partner relationship (self-referential)
    current_partner_id = Column(
        UUID(as_uuid=True), 
        ForeignKey('users.id', ondelete='SET NULL'), 
        nullable=True
    )
    
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
    
    # Relationships to PartnerInvitation and Partnership are configured
    # in app/db/models/__init__.py to resolve circular dependencies.

    # Relationship to user_badges
    user_badges: Mapped[List["UserBadge"]] = relationship(
        "UserBadge", back_populates="user", cascade="all, delete-orphan"
    )

    # Relationship to goals
    goals: Mapped[List["Goal"]] = relationship(
        "Goal", back_populates="user", cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<User {self.email}>"