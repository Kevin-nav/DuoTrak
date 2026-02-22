import pytest

from app.ai.langgraph_goal_pipeline import LangGraphGoalPipeline


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


@pytest.mark.asyncio
async def test_langgraph_pipeline_returns_contract_shape():
    store = InMemorySessionStore()
    pipeline = LangGraphGoalPipeline(
        pinecone_service=object(),
        session_store=store,
        session_ttl_seconds=900,
    )

    await pipeline.generate_strategic_questions(
        user_id="user-1",
        session_id="s1",
        wizard_data={
            "goal_description": "Run a 5k",
            "motivation": "Get healthier",
            "availability": ["weekday mornings"],
        },
        user_context={"historical_goals": []},
    )

    result = await pipeline.create_plan(
        session_id="s1",
        user_id="user-1",
        answers={"biggest_obstacle": "Limited time"},
    )

    assert "goal_plan" in result
    assert "partner_integration" in result
