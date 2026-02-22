from types import SimpleNamespace

from app.ai.orchestrator_factory import create_orchestrator


class InMemorySessionStore:
    def __init__(self):
        self.data = {}

    async def put(self, session_id, payload, ttl_seconds=None):
        _ = ttl_seconds
        self.data[session_id] = payload

    async def get(self, session_id):
        return self.data.get(session_id)

    async def delete(self, session_id):
        self.data.pop(session_id, None)


def test_factory_selects_langgraph_when_flag_enabled():
    settings = SimpleNamespace(
        AI_ORCHESTRATOR="langgraph",
        GOAL_CREATION_SESSION_TTL_SECONDS=900,
    )
    orchestrator = create_orchestrator(
        settings=settings,
        pinecone_service=SimpleNamespace(),
        gemini_config=SimpleNamespace(),
        session_store=InMemorySessionStore(),
    )
    assert orchestrator.__class__.__name__ == "LangGraphGoalPipeline"
