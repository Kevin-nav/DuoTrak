# backend/app/db/models/goal.py

import uuid
from typing import TYPE_CHECKING, List

import sqlalchemy as sa
from sqlalchemy import Column, Enum, ForeignKey, String, Integer, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base

if TYPE_CHECKING:
    from .user import User
    from .task import Task

class Goal(Base):
    __tablename__ = "goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    category = Column(String(500), nullable=True)
    icon = Column(String(50), nullable=True)
    color = Column(String(20), nullable=True)
    is_habit = Column(sa.Boolean, server_default="false", nullable=False)
    is_archived = Column(sa.Boolean, server_default="false", nullable=False)
    
    # Foreign key to the user who owns the goal
    user_id = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="goals")
    tasks: Mapped[List["Task"]] = relationship(
        "Task", back_populates="goal", cascade="all, delete-orphan"
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

    def __repr__(self) -> str:
        return f"<Goal {self.name}>"
