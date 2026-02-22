from types import SimpleNamespace

from app.ai.orchestrator_factory import create_orchestrator
from app.services import gemini_config as gemini_config_module


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


def test_gemini_config_routes_complex_agents_to_flash_only(monkeypatch):
    captured = {}

    class FakeLLM:
        def __init__(self, *, model, api_key, temperature):
            captured["model"] = model
            captured["api_key"] = api_key
            captured["temperature"] = temperature

    monkeypatch.setattr(gemini_config_module, "LLM", FakeLLM)
    monkeypatch.setattr(gemini_config_module.settings, "FLASH_MODEL", "gemini-3-flash", raising=False)
    monkeypatch.setattr(gemini_config_module.settings, "PRO_MODEL", "gemini-2.5-pro", raising=False)

    config = gemini_config_module.GeminiModelConfig()
    llm = config.get_model_for_agent("goal_strategist")

    assert llm is not None
    assert captured["model"] == "gemini/gemini-3-flash"
