import json
import logging
from typing import Any, Dict, Optional


logger = logging.getLogger(__name__)


class GoalCreationSessionStore:
    """Redis-backed store for multi-step goal creation sessions."""

    def __init__(
        self,
        redis_client: Any,
        default_ttl_seconds: int = 900,
        key_prefix: str = "goal_creation_session",
    ) -> None:
        self._redis = redis_client
        self._default_ttl_seconds = default_ttl_seconds
        self._key_prefix = key_prefix

    def _key(self, session_id: str) -> str:
        return f"{self._key_prefix}:{session_id}"

    async def put(
        self,
        session_id: str,
        data: Dict[str, Any],
        ttl_seconds: Optional[int] = None,
    ) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl_seconds
        await self._redis.setex(self._key(session_id), int(ttl), json.dumps(data))

    async def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        raw = await self._redis.get(self._key(session_id))
        if raw is None:
            return None

        try:
            return json.loads(raw)
        except (TypeError, json.JSONDecodeError):
            logger.warning("Corrupt goal creation session payload for %s", session_id)
            return None

    async def delete(self, session_id: str) -> None:
        await self._redis.delete(self._key(session_id))
