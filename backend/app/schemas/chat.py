from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    conversation_id: UUID4
    sender_id: UUID4
    parent_message_id: Optional[UUID4] = None

class Message(MessageBase):
    message_id: UUID4
    conversation_id: UUID4
    sender_id: UUID4
    created_at: datetime
    parent_message_id: Optional[UUID4] = None
    status: str

    class Config:
        from_attributes = True

class ReactionBase(BaseModel):
    emoji: str

class ReactionCreate(ReactionBase):
    message_id: UUID4
    user_id: UUID4

class Reaction(ReactionBase):
    reaction_id: UUID4
    message_id: UUID4
    user_id: UUID4

    class Config:
        from_attributes = True

class AttachmentBase(BaseModel):
    file_name: str
    file_type: str
    file_size: int
    storage_url: str
    thumbnail_url: Optional[str] = None

class AttachmentCreate(AttachmentBase):
    message_id: UUID4

class Attachment(AttachmentBase):
    attachment_id: UUID4
    message_id: UUID4
    class Config:
        from_attributes = True
