from fastapi import APIRouter, WebSocket, Depends, HTTPException, UploadFile, Form, WebSocketDisconnect
from sqlalchemy.orm import Session
from uuid import UUID
from app.services.chat_ws_manager import manager
from app.dependencies import get_current_user_ws
from app.services import chat_service
from app.schemas.chat import Message, Attachment
from app.api.v1.deps import get_db
import json

router = APIRouter()

@router.get("/history/{conversation_id}", response_model=list[Message])
async def read_message_history(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_ws) # Using the WS dependency for now, will be replaced with HTTP auth
):
    """Retrieve chat history for a conversation."""
    history = await chat_service.get_message_history(db=db, conversation_id=conversation_id)
    return history

@router.post("/attachments", response_model=Attachment)
async def upload_chat_attachment(
    file: UploadFile,
    message_id: UUID = Form(...),
    conversation_id: UUID = Form(...),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_ws) # Using the WS dependency for now, will be replaced with HTTP auth
):
    """Uploads a file attachment to a message."""
    try:
        attachment = await chat_service.upload_attachment(
            db=db,
            file=file,
            message_id=message_id,
            user_id=UUID(current_user_id),
            conversation_id=conversation_id,
        )
        return attachment
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload attachment: {e}")

@router.websocket("/ws/chat/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str, user_id: str = Depends(get_current_user_ws)):
    await manager.connect(websocket, conversation_id, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                message_type = message_data.get("type")

                if message_type == "typing":
                    is_typing = message_data.get("is_typing", False)
                    await manager.set_typing_status(user_id, conversation_id, is_typing)
                elif message_type == "chat_message":
                    content = message_data.get("content")
                    if content:
                        # For now, just broadcast the message. Full logic will be in the service.
                        await manager.broadcast(f"User {user_id} says: {content}", conversation_id)
                else:
                    # Handle unknown message types or just broadcast raw data
                    await manager.broadcast(data, conversation_id)
            except json.JSONDecodeError:
                # If not JSON, treat as a raw chat message for now
                await manager.broadcast(f"User {user_id} says: {data}", conversation_id)

    except WebSocketDisconnect:
        pass # Client disconnected gracefully
    except Exception as e:
        # Log other unexpected errors
        print(f"WebSocket error: {e}")
    finally:
        await manager.disconnect(websocket, conversation_id, user_id)
