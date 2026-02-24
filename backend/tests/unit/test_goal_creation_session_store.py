import pytest
import asyncio
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from redis.exceptions import ConnectionError as RedisConnectionError

from app.services.goal_creation_session_store import GoalCreationSessionStore
from app.personalization.outcome_profile_store import OutcomeProfileStore


class FakeRedis:
    def __init__(self):
        self.data = {}

    async def setex(self, key, _ttl_seconds, value):
        self.data[key] = value

    async def get(self, key):
        return self.data.get(key)

    async def delete(self, key):
        self.data.pop(key, None)


class FailingRedis:
    async def setex(self, key, _ttl_seconds, value):
        _ = key, value
        raise RedisConnectionError("dns resolution failed")

    async def get(self, key):
        _ = key
        raise RedisConnectionError("dns resolution failed")

    async def delete(self, key):
        _ = key
        raise RedisConnectionError("dns resolution failed")


class WriteOkReadFailRedis:
    def __init__(self):
        self.data = {}

    async def setex(self, key, _ttl_seconds, value):
        self.data[key] = value

    async def get(self, key):
        _ = key
        raise RedisConnectionError("dns resolution failed")

    async def delete(self, key):
        self.data.pop(key, None)


@pytest.mark.asyncio
async def test_session_survives_new_orchestrator_instance():
    redis_client = FakeRedis()

    store = GoalCreationSessionStore(redis_client)
    await store.put("s1", {"user_id": "u1"}, ttl_seconds=900)

    store2 = GoalCreationSessionStore(redis_client)
    data = await store2.get("s1")
    assert data is not None
    assert data["user_id"] == "u1"


@pytest.mark.asyncio
async def test_session_store_falls_back_to_memory_when_redis_unavailable():
    store = GoalCreationSessionStore(
        redis_client=FailingRedis(),
        allow_in_memory_fallback=True,
    )

    await store.put("s1", {"user_id": "u1"}, ttl_seconds=60)
    data = await store.get("s1")

    assert data is not None
    assert data["user_id"] == "u1"


@pytest.mark.asyncio
async def test_session_store_without_fallback_raises_on_redis_failure():
    store = GoalCreationSessionStore(
        redis_client=FailingRedis(),
        allow_in_memory_fallback=False,
    )

    with pytest.raises(RedisConnectionError):
        await store.put("s1", {"user_id": "u1"}, ttl_seconds=60)


@pytest.mark.asyncio
async def test_memory_fallback_respects_ttl():
    store = GoalCreationSessionStore(
        redis_client=FailingRedis(),
        allow_in_memory_fallback=True,
    )

    await store.put("s1", {"user_id": "u1"}, ttl_seconds=1)
    await asyncio.sleep(1.05)

    assert await store.get("s1") is None


@pytest.mark.asyncio
async def test_session_store_uses_fallback_when_read_fails_after_successful_write():
    store = GoalCreationSessionStore(
        redis_client=WriteOkReadFailRedis(),
        allow_in_memory_fallback=True,
    )

    await store.put("s1", {"user_id": "u1"}, ttl_seconds=60)
    data = await store.get("s1")

    assert data is not None
    assert data["user_id"] == "u1"


class FakePineconeService:
    def __init__(self, matches):
        self.index = object()
        self._matches = matches

    def _generate_embedding(self, _text):
        return [0.0] * 8

    async def _query_index(self, **_kwargs):
        return SimpleNamespace(matches=self._matches)


@pytest.mark.asyncio
async def test_outcome_profile_store_uses_only_outcome_signals_and_90_day_window():
    now = datetime.now(timezone.utc)
    recent_completion = SimpleNamespace(
        metadata={
            "interaction_type": "task_completion",
            "timestamp": now.isoformat(),
        }
    )
    recent_skip = SimpleNamespace(
        metadata={
            "interaction_type": "task_skip",
            "timestamp": (now - timedelta(days=5)).isoformat(),
        }
    )
    old_completion = SimpleNamespace(
        metadata={
            "interaction_type": "task_completion",
            "timestamp": (now - timedelta(days=120)).isoformat(),
        }
    )
    non_outcome = SimpleNamespace(
        metadata={
            "interaction_type": "goal_creation",
            "timestamp": now.isoformat(),
        }
    )

    store = OutcomeProfileStore(FakePineconeService([recent_completion, recent_skip, old_completion, non_outcome]))
    result = await store.build_profile("u1", days=90)
    profile = result["outcome_profile"]

    assert profile["window_days"] == 90
    assert profile["signals"] == "outcome_only"
    assert profile["completion_count"] == 1
    assert profile["skip_count"] == 1
    assert profile["sample_size"] == 2
