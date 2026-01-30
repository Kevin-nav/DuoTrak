from fastapi import WebSocket
from typing import Dict, List, Set
import json
from app.core.redis_config import redis_client

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.online_users_key_prefix = "online_users:"
        self.typing_users_key_prefix = "typing_users:"

    async def connect(self, websocket: WebSocket, conversation_id: str, user_id: str):
        await websocket.accept()
        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = []
        self.active_connections[conversation_id].append(websocket)
        await self._set_user_online(user_id, conversation_id)
        await self.broadcast_presence(conversation_id)

    async def disconnect(self, websocket: WebSocket, conversation_id: str, user_id: str):
        if conversation_id in self.active_connections:
            self.active_connections[conversation_id].remove(websocket)
            if not self.active_connections[conversation_id]:
                del self.active_connections[conversation_id]
        await self._set_user_offline(user_id, conversation_id)
        await self.broadcast_presence(conversation_id)

    async def _set_user_online(self, user_id: str, conversation_id: str):
        key = f"{self.online_users_key_prefix}{conversation_id}"
        await redis_client.sadd(key, user_id)

    async def _set_user_offline(self, user_id: str, conversation_id: str):
        key = f"{self.online_users_key_prefix}{conversation_id}"
        await redis_client.srem(key, user_id)
        # Also remove from typing status if they go offline
        await self.set_typing_status(user_id, conversation_id, False)

    async def get_online_users(self, conversation_id: str) -> Set[str]:
        key = f"{self.online_users_key_prefix}{conversation_id}"
        return await redis_client.smembers(key)

    async def set_typing_status(self, user_id: str, conversation_id: str, is_typing: bool):
        key = f"{self.typing_users_key_prefix}{conversation_id}"
        if is_typing:
            await redis_client.sadd(key, user_id)
            # Set an expiry for typing status, e.g., 5 seconds
            await redis_client.expire(key, 5)
        else:
            await redis_client.srem(key, user_id)
        await self.broadcast_typing_status(conversation_id, user_id, is_typing)

    async def get_typing_users(self, conversation_id: str) -> Set[str]:
        key = f"{self.typing_users_key_prefix}{conversation_id}"
        return await redis_client.smembers(key)

    async def broadcast(self, message: str, conversation_id: str):
        if conversation_id in self.active_connections:
            for connection in self.active_connections[conversation_id]:
                await connection.send_text(message)

    async def broadcast_presence(self, conversation_id: str):
        online_users = await self.get_online_users(conversation_id)
        message = {"type": "presence_update", "online_users": list(online_users)}
        await self.broadcast(json.dumps(message), conversation_id)

    async def broadcast_typing_status(self, conversation_id: str, user_id: str, is_typing: bool):
        typing_users = await self.get_typing_users(conversation_id)
        message = {"type": "typing_update", "user_id": user_id, "is_typing": is_typing, "typing_users": list(typing_users)}
        await self.broadcast(json.dumps(message), conversation_id)

manager = WebSocketManager()
