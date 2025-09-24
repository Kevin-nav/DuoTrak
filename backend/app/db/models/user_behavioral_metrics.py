# backend/app/db/models/user_behavioral_metrics.py

import uuid
from sqlalchemy import Column, ForeignKey, String, Float, JSON, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base

class UserBehavioralMetrics(Base):
    __tablename__ = "user_behavioral_metrics"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, default=uuid.uuid4)
    time_of_day_success = Column(JSON, nullable=True)
    procrastination_index = Column(Float, nullable=True)
    category_affinity = Column(JSON, nullable=True)
    archetype = Column(String(50), nullable=True)
    last_updated_at = Column(
        TIMESTAMP(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(),
        nullable=False
    )
