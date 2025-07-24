# backend/app/db/models/task.py

import uuid
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy import Column, Enum, ForeignKey, String, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base

if TYPE_CHECKING:
    from .goal import Goal

class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    status = Column(String(50), default="pending", nullable=False) # e.g., pending, completed, pending-verification
    due_date = Column(TIMESTAMP(timezone=True), nullable=True)

    # Foreign key to the goal this task belongs to
    goal_id = mapped_column(ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)

    # Relationship
    goal: Mapped["Goal"] = relationship(back_populates="tasks")

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
        return f"<Task {self.name}>"
