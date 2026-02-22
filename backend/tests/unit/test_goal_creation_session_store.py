import pytest

from app.services.goal_creation_session_store import GoalCreationSessionStore


class FakeRedis:
    def __init__(self):
        self.data = {}

    async def setex(self, key, _ttl_seconds, value):
        self.data[key] = value

    async def get(self, key):
        return self.data.get(key)

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
