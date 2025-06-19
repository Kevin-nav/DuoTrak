import uuid
from sqlalchemy import Column, String, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class Partnership(Base):
    __tablename__ = 'partnerships'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user1_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    user2_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    inviter_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    status = Column(String, nullable=False, default='pending') # pending, accepted, rejected

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    user1 = relationship("User", foreign_keys=[user1_id], back_populates="partnerships1")
    user2 = relationship("User", foreign_keys=[user2_id], back_populates="partnerships2")
    inviter = relationship("User", foreign_keys=[inviter_id])
