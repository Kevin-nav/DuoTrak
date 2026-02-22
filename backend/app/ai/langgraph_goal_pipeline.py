import time
from typing import Any, Dict, List, Optional

from app.services.goal_creation_session_store import GoalCreationSessionStore


class LangGraphGoalPipeline:
    """
    Deterministic, linear goal pipeline that mirrors LangGraph node flow:
    profile -> questions -> plan -> score.
    """

    def __init__(
        self,
        pinecone_service: Any,
        session_store: GoalCreationSessionStore,
        session_ttl_seconds: int = 900,
    ) -> None:
        self.pinecone_service = pinecone_service
        self.session_store = session_store
        self.session_ttl_seconds = session_ttl_seconds

    async def generate_strategic_questions(
        self,
        user_id: str,
        session_id: str,
        wizard_data: Dict[str, Any],
        user_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        start_time = time.time()

        profile = self._profile_node(wizard_data, user_context)
        questions = self._question_node(wizard_data, user_context, profile)

        await self.session_store.put(
            session_id,
            {
                "user_id": user_id,
                "wizard_data": wizard_data,
                "user_context": user_context,
                "profile_output": profile,
            },
            ttl_seconds=self.session_ttl_seconds,
        )

        return {
            "user_profile_summary": profile,
            "questions": questions,
            "execution_time_ms": (time.time() - start_time) * 1000,
        }

    async def create_goal_plan_from_answers(
        self,
        session_id: str,
        user_id: str,
        answers: Dict[str, str],
    ) -> Dict[str, Any]:
        start_time = time.time()

        session = await self.session_store.get(session_id)
        if session is None:
            raise ValueError("Session not found or expired. Please restart from strategic questions.")

        context = {**session, "strategic_answers": answers, "user_id": user_id}
        goal_plan = self._plan_node(context)
        score = self._score_node(goal_plan, context)

        return {
            "goal_plan": goal_plan,
            "partner_integration": goal_plan.get("partner_integration", {}),
            "personalization_score": score,
            "execution_time_ms": (time.time() - start_time) * 1000,
        }

    async def create_plan(
        self,
        session_id: str,
        user_id: str,
        answers: Dict[str, str],
    ) -> Dict[str, Any]:
        return await self.create_goal_plan_from_answers(
            session_id=session_id,
            user_id=user_id,
            answers=answers,
        )

    def _profile_node(self, wizard_data: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        has_history = bool(user_context.get("historical_goals"))
        motivators: List[str] = [wizard_data.get("motivation", "Personal growth")]
        risks: List[str] = ["Time management"]
        if has_history:
            risks.append("Consistency dips from historical patterns")

        return {
            "archetype": "Steady Climber" if has_history else "Momentum Builder",
            "key_motivators": motivators,
            "risk_factors": risks,
            "confidence_level": 0.72 if has_history else 0.65,
        }

    def _question_node(
        self,
        wizard_data: Dict[str, Any],
        user_context: Dict[str, Any],
        profile: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        _ = user_context, profile
        return [
            {
                "question": "What is the biggest obstacle you expect this week?",
                "question_key": "biggest_obstacle",
                "context": "Helps pre-plan mitigation before execution starts.",
                "suggested_answers": ["Limited time", "Low energy", "Scheduling conflicts"],
                "allow_custom_answer": True,
            },
            {
                "question": "When will you do your first commitment block?",
                "question_key": "first_commitment_block",
                "context": "Anchors immediate action in a concrete schedule.",
                "suggested_answers": wizard_data.get("availability", ["Weekday morning", "Weekend"]),
                "allow_custom_answer": True,
            },
            {
                "question": "How should your partner hold you accountable?",
                "question_key": "partner_accountability_style",
                "context": "Aligns accountability mode with your preference.",
                "suggested_answers": ["Daily check-in", "Progress photo", "Weekly recap"],
                "allow_custom_answer": True,
            },
        ]

    def _plan_node(self, context: Dict[str, Any]) -> Dict[str, Any]:
        wizard_data = context.get("wizard_data", {})
        answers = context.get("strategic_answers", {})
        title = f"Strategic Plan: {wizard_data.get('goal_description', 'Personal Goal')[:50]}"

        return {
            "title": title,
            "description": "Structured plan generated from profile and strategic answers.",
            "category": "personal",
            "difficulty_level": 0.6,
            "estimated_duration_days": 30,
            "weekly_tasks": [
                {
                    "title": "Weekly execution block",
                    "description": "Complete one focused block aligned to your goal.",
                    "success_metric": "1 completion per week",
                }
            ],
            "daily_habits": [
                {
                    "title": "Daily check-in",
                    "description": "Log one progress update.",
                    "success_metric": "1 log per day",
                }
            ],
            "milestone_markers": [
                {
                    "title": "Week 1 momentum",
                    "description": "Complete first 3 check-ins and first weekly block.",
                }
            ],
            "partner_integration": {
                "check_in_schedule": ["Mon", "Thu"],
                "accountability_actions": ["Send progress update", "Confirm next action"],
                "support_strategies": ["Encouragement message", "Weekly review"],
                "celebration_milestones": ["Week 1 consistency"],
            },
            "motivation_anchors": [wizard_data.get("motivation", "Personal growth")],
            "risk_mitigation": [
                {
                    "risk": answers.get("biggest_obstacle", "Limited time"),
                    "mitigation": "Pre-schedule the smallest executable step.",
                }
            ],
        }

    def _score_node(self, goal_plan: Dict[str, Any], context: Dict[str, Any]) -> float:
        _ = goal_plan, context
        return 7.4
