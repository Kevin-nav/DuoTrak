import json
import logging
import time
import asyncio
from typing import Any, Dict, Optional

from redis.exceptions import RedisError


logger = logging.getLogger(__name__)


class GoalCreationSessionStore:
    """Redis-backed store for multi-step goal creation sessions."""

    def __init__(
        self,
        redis_client: Any,
        default_ttl_seconds: int = 900,
        key_prefix: str = "goal_creation_session",
        allow_in_memory_fallback: bool = False,
    ) -> None:
        self._redis = redis_client
        self._default_ttl_seconds = default_ttl_seconds
        self._key_prefix = key_prefix
        self._allow_in_memory_fallback = allow_in_memory_fallback
        self._memory_fallback: Dict[str, Dict[str, Any]] = {}
        self._memory_lock = asyncio.Lock()

    def _key(self, session_id: str) -> str:
        return f"{self._key_prefix}:{session_id}"

    async def _set_fallback(self, session_id: str, raw_payload: str, ttl_seconds: int) -> None:
        if not self._allow_in_memory_fallback:
            return
        expires_at = time.monotonic() + max(1, int(ttl_seconds))
        async with self._memory_lock:
            self._memory_fallback[session_id] = {
                "raw_payload": raw_payload,
                "expires_at": expires_at,
            }

    async def _get_fallback_raw(self, session_id: str) -> Optional[str]:
        if not self._allow_in_memory_fallback:
            return None
        async with self._memory_lock:
            entry = self._memory_fallback.get(session_id)
            if entry is None:
                return None
            if float(entry["expires_at"]) <= time.monotonic():
                self._memory_fallback.pop(session_id, None)
                return None
            return str(entry["raw_payload"])

    async def _delete_fallback(self, session_id: str) -> None:
        if not self._allow_in_memory_fallback:
            return
        async with self._memory_lock:
            self._memory_fallback.pop(session_id, None)

    async def put(
        self,
        session_id: str,
        data: Dict[str, Any],
        ttl_seconds: Optional[int] = None,
    ) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl_seconds
        raw_payload = json.dumps(data)
        # Keep a local TTL copy when fallback is enabled so a later transient Redis
        # outage (between /questions and /plan) can still complete in-process.
        await self._set_fallback(session_id=session_id, raw_payload=raw_payload, ttl_seconds=int(ttl))
        try:
            await self._redis.setex(self._key(session_id), int(ttl), raw_payload)
        except RedisError as exc:
            if not self._allow_in_memory_fallback:
                raise
            logger.warning(
                "Redis unavailable while writing goal creation session %s; using in-memory fallback. Error: %s",
                session_id,
                exc,
            )

    async def get(self, session_id: str) -> Optional[Dict[str, Any]]:
        try:
            raw = await self._redis.get(self._key(session_id))
        except RedisError as exc:
            if not self._allow_in_memory_fallback:
                raise
            logger.warning(
                "Redis unavailable while reading goal creation session %s; trying in-memory fallback. Error: %s",
                session_id,
                exc,
            )
            raw = await self._get_fallback_raw(session_id)

        if raw is None:
            raw = await self._get_fallback_raw(session_id)
            if raw is None:
                return None

        try:
            return json.loads(raw)
        except (TypeError, json.JSONDecodeError):
            logger.warning("Corrupt goal creation session payload for %s", session_id)
            return None

    async def delete(self, session_id: str) -> None:
        try:
            await self._redis.delete(self._key(session_id))
        except RedisError as exc:
            if not self._allow_in_memory_fallback:
                raise
            logger.warning(
                "Redis unavailable while deleting goal creation session %s; deleting in-memory fallback only. Error: %s",
                session_id,
                exc,
            )
        finally:
            await self._delete_fallback(session_id)
