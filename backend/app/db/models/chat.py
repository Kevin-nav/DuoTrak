from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, TEXT, INTEGER, Enum
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base import Base

class Message(Base):
    __tablename__ = 'messages'
    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), nullable=False)
    sender_id = Column(UUID(as_uuid=True), nullable=False)
    content = Column(TEXT, nullable=False)
    created_at = Column(TIMESTAMP, server_default='now()', nullable=False)
    parent_message_id = Column(UUID(as_uuid=True), ForeignKey('messages.message_id'), nullable=True)
    status = Column(Enum('sent', 'delivered', 'read', name='message_status_enum'), nullable=False, default='sent')

class Reaction(Base):
    __tablename__ = 'reactions'
    reaction_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey('messages.message_id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    emoji = Column(String, nullable=False)

class Attachment(Base):
    __tablename__ = 'attachments'
    attachment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey('messages.message_id'), nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(INTEGER, nullable=False)
    storage_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
