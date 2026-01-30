import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from uuid import uuid4
from fastapi import UploadFile

from app.services.chat_service import get_message_history, send_message, add_reaction, upload_attachment
from app.schemas.chat import Message, MessageCreate, Reaction, ReactionCreate, Attachment
from app.services.chat_ws_manager import manager
from app.db.models.chat import Message as DBMessage, Attachment as DBAttachment

@pytest.mark.asyncio
async def test_get_message_history():
    """Tests that message history is retrieved for a conversation."""
    mock_db = AsyncMock()
    conversation_id = uuid4()

    # Setup a mock for the chain of calls: result.scalars().all()
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [
        DBMessage(message_id=uuid4(), conversation_id=conversation_id, sender_id=uuid4(), content="Hello", created_at="2025-09-24T12:00:00Z", status="read"),
        DBMessage(message_id=uuid4(), conversation_id=conversation_id, sender_id=uuid4(), content="Hi there", created_at="2025-09-24T12:01:00Z", status="read"),
    ]

    mock_result = MagicMock()
    mock_result.scalars.return_value = mock_scalars

    # The awaited call to db.execute should return our mock_result
    mock_db.execute.return_value = mock_result

    # Call the service function
    result = await get_message_history(db=mock_db, conversation_id=conversation_id)

    # Assertions
    assert len(result) == 2
    assert isinstance(result[0], DBMessage)
    mock_db.execute.assert_called_once()

@pytest.mark.asyncio
async def test_send_message():
    """Tests that a message is created and broadcasted."""
    mock_db = AsyncMock()
    mock_manager = AsyncMock(spec=manager)
    conversation_id = uuid4()
    sender_id = uuid4()
    message_content = "Test message"

    message_to_create = MessageCreate(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=message_content
    )

    # Mock the created message object
    created_message = MagicMock()
    created_message.content = message_content
    created_message.conversation_id = conversation_id
    
    # Configure the mock to return the created message when refresh is called
    mock_db.refresh = AsyncMock()
    
    # Mock the commit and refresh operations
    mock_db.commit = AsyncMock()
    mock_db.add = MagicMock()

    # Call the service function
    with patch('app.services.chat_service.Message') as MockMessage:
        MockMessage.return_value = created_message
        result = await send_message(db=mock_db, message=message_to_create, manager=mock_manager)

    # Assertions
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()
    mock_manager.broadcast.assert_called_once_with(message_content, str(conversation_id))

@pytest.mark.asyncio
async def test_add_reaction():
    """Tests that a reaction is created and broadcasted."""
    mock_db = AsyncMock()
    mock_manager = AsyncMock(spec=manager)
    message_id = uuid4()
    user_id = uuid4()
    emoji = "👍"
    conversation_id = uuid4()

    reaction_to_create = ReactionCreate(
        message_id=message_id,
        user_id=user_id,
        emoji=emoji
    )

    # Mock the created reaction object
    created_reaction = MagicMock()
    created_reaction.emoji = emoji
    created_reaction.message_id = message_id
    
    # Mock the message that the reaction belongs to
    mock_message = MagicMock()
    mock_message.conversation_id = conversation_id
    
    # Configure the mock database operations
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.get = AsyncMock(return_value=mock_message)

    # Call the service function
    with patch('app.services.chat_service.Reaction') as MockReaction:
        MockReaction.return_value = created_reaction
        result = await add_reaction(db=mock_db, reaction=reaction_to_create, manager=mock_manager)

    # Assertions
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()
    mock_db.get.assert_called_once_with(DBMessage, message_id)
    mock_manager.broadcast.assert_called_once()

@pytest.mark.asyncio
async def test_upload_attachment():
    """Tests that an attachment is uploaded and its metadata saved."""
    mock_db = AsyncMock()
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "test.jpg"
    mock_file.content_type = "image/jpeg"
    mock_file.size = 1024
    mock_file.read = AsyncMock(return_value=b"file_content")

    message_id = uuid4()
    user_id = uuid4()
    conversation_id = uuid4()
    attachment_id = uuid4()

    # Mock the storage service
    mock_storage_url = f"https://example.com/storage/attachments/{conversation_id}/{message_id}/test.jpg"
    
    # Configure the mock database operations
    mock_db.commit = AsyncMock()
    mock_db.add = MagicMock()
    
    # Create a mock DB attachment with all required fields
    mock_db_attachment = MagicMock(spec=DBAttachment)
    mock_db_attachment.attachment_id = attachment_id
    mock_db_attachment.message_id = message_id
    mock_db_attachment.file_name = "test.jpg"
    mock_db_attachment.file_type = "image/jpeg"
    mock_db_attachment.file_size = 1024
    mock_db_attachment.storage_url = mock_storage_url
    mock_db_attachment.thumbnail_url = f"{mock_storage_url}.thumb"
    
    # Mock the refresh method to simulate setting the attachment_id
    async def mock_refresh(obj):
        obj.attachment_id = attachment_id
        
    mock_db.refresh = AsyncMock(side_effect=mock_refresh)

    # Mock the storage service
    with patch('app.services.chat_service.storage_service') as mock_storage_service:
        mock_storage_service.upload_file = AsyncMock(return_value=mock_storage_url)
        
        # Mock the DBAttachment constructor
        with patch('app.services.chat_service.DBAttachment') as MockDBAttachment:
            MockDBAttachment.return_value = mock_db_attachment
            
            # Call the service function
            attachment = await upload_attachment(
                db=mock_db,
                file=mock_file,
                message_id=message_id,
                user_id=user_id,
                conversation_id=conversation_id,
            )

    # Assertions
    mock_file.read.assert_called_once()
    mock_storage_service.upload_file.assert_called_once()
    mock_db.add.assert_called_once_with(mock_db_attachment)
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once_with(mock_db_attachment)
    
    assert isinstance(attachment, Attachment)
    assert attachment.file_name == "test.jpg"
    assert attachment.file_type == "image/jpeg"
    assert attachment.file_size == 1024
    assert attachment.storage_url == mock_storage_url
    assert attachment.thumbnail_url == f"{mock_storage_url}.thumb"
    assert attachment.attachment_id == attachment_id
    assert attachment.message_id == message_id