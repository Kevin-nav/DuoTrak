from sqlalchemy.orm import Session
from sqlalchemy import select
from uuid import UUID
from app.db.models.chat import Message, Reaction, Attachment as DBAttachment
from app.schemas.chat import MessageCreate, ReactionCreate, Attachment
from app.services.chat_ws_manager import WebSocketManager
from fastapi import UploadFile
from app.core.config import settings
from app.services.storage_service import storage_service
import os

async def get_message_history(db: Session, conversation_id: UUID) -> list[Message]:
    """Fetches the message history for a given conversation."""
    stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

async def send_message(db: Session, message: MessageCreate, manager: WebSocketManager) -> Message:
    """Creates a new message and broadcasts it."""
    db_message = Message(**message.model_dump())
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    await manager.broadcast(db_message.content, str(db_message.conversation_id))
    return Message.model_validate(db_message)

async def add_reaction(db: Session, reaction: ReactionCreate, manager: WebSocketManager) -> Reaction:
    """Adds a new reaction to a message and broadcasts it."""
    db_reaction = Reaction(**reaction.model_dump())
    db.add(db_reaction)
    await db.commit()
    await db.refresh(db_reaction)
    # Broadcast the reaction to the conversation where the message belongs
    # For now, we need to fetch the message to get the conversation_id
    message = await db.get(Message, reaction.message_id)
    if message:
        await manager.broadcast(f"Reaction {db_reaction.emoji} to message {db_reaction.message_id}", str(message.conversation_id))
    return Reaction.model_validate(db_reaction)

async def upload_attachment(
    db: Session,
    file: UploadFile,
    message_id: UUID,
    user_id: UUID,
    conversation_id: UUID,
) -> Attachment:
    """Uploads a file attachment to storage and saves its metadata to the database."""
    file_content = await file.read()
    file_size = len(file_content)
    file_name = file.filename
    file_type = file.content_type

    # Validate file size and type based on research.md
    # For now, we'll assume validation happens at the API layer or is handled by the client

    # Upload to storage using the generic storage_service
    storage_path = f"attachments/{conversation_id}/{message_id}/{file_name}"
    storage_url = await storage_service.upload_file(
        bucket_name=settings.R2_BUCKET_NAME, # Use the configured R2 bucket name
        file_contents=file_content,
        path_in_bucket=storage_path,
        content_type=file_type
    )

    # Create thumbnail if it's an image (placeholder for now)
    thumbnail_url = None
    if file_type and file_type.startswith("image/"):
        # Placeholder for thumbnail generation logic
        thumbnail_url = f"{storage_url}.thumb"

    db_attachment = DBAttachment(
        message_id=message_id,
        file_name=file_name,
        file_type=file_type,
        file_size=file_size,
        storage_url=storage_url,
        thumbnail_url=thumbnail_url
    )
    db.add(db_attachment)
    await db.commit()
    await db.refresh(db_attachment)
    return Attachment.model_validate(db_attachment)