import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)
    
    is_active = Column(Boolean(), default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # A user can be user1 in many partnerships
    partnerships1 = relationship("Partnership", foreign_keys="[Partnership.user1_id]", back_populates="user1")
    # A user can be user2 in many partnerships
    partnerships2 = relationship("Partnership", foreign_keys="[Partnership.user2_id]", back_populates="user2")
