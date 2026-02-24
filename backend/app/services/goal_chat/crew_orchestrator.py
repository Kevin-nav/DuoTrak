import json
import logging
from typing import Any, Dict, List

from crewai import Agent, Crew, Process, Task
from crewai.tools import BaseTool

from app.services.gemini_config import GeminiModelConfig

logger = logging.getLogger(__name__)


class SessionStateTool(BaseTool):
    name: str = "Session State Tool"
    description: str = "Returns current goal-chat slots and missing fields."
    state: Dict[str, Any]

    def _run(self) -> str:
        return json.dumps(self.state)


class SlotValidationTool(BaseTool):
    name: str = "Slot Validation Tool"
    description: str = "Returns required slot rules for goal types."

    def _run(self) -> str:
        return json.dumps(
            {
                "base_required": [
                    "intent",
                    "success_definition",
                    "availability",
                    "time_budget",
                    "accountability_mode",
                    "tasks",
                ],
                "conditional": {
                    "target-date": ["deadline"],
                    "habit": ["review_cycle"],
                    "milestone": ["review_cycle"],
                },
            }
        )


class PartnerPolicyTool(BaseTool):
    name: str = "Partner Policy Tool"
    description: str = "Returns mandatory partner-accountability rules."

    def _run(self) -> str:
        return json.dumps(
            {
                "partner_required_for_create": True,
                "task_requirements": ["requires_partner_review", "review_sla", "escalation_policy"],
            }
        )


class GoalChatCrewOrchestrator:
    def __init__(self, gemini_config: GeminiModelConfig) -> None:
        self._gemini_config = gemini_config

    def enrich_turn(
        self,
        user_message: str,
        current_slots: Dict[str, Any],
        missing_slots: List[str],
    ) -> Dict[str, Any]:
        try:
            state_tool = SessionStateTool(
                state={"current_slots": current_slots, "missing_slots": missing_slots, "user_message": user_message}
            )
            slot_tool = SlotValidationTool()
            partner_tool = PartnerPolicyTool()

            analyst = Agent(
                role="Goal Chat Intent Extractor",
                goal="Extract structured goal-planning details from a conversational user message.",
                backstory="Specialist in robust entity extraction for goal coaching.",
                llm=self._gemini_config.get_model_for_agent("goal_chat_intent_extractor"),
                tools=[state_tool, slot_tool, partner_tool],
                verbose=False,
            )

            strategist = Agent(
                role="Goal Chat Question Strategist",
                goal="Ask one concise next question and suggest quick-reply chips.",
                backstory="Conversation designer focused on low-friction, one-question goal interviews.",
                llm=self._gemini_config.get_model_for_agent("goal_chat_question_strategist"),
                tools=[state_tool, slot_tool, partner_tool],
                verbose=False,
            )

            extraction_task = Task(
                description=f"""
Analyze the latest user message and extract slots if present.
User message:
{user_message}

Current slots:
{json.dumps(current_slots)}

Missing slots:
{json.dumps(missing_slots)}

Return STRICT JSON only:
{{
  "extracted_slots": {{
    "intent": "habit|milestone|target-date or omit",
    "success_definition": "string or omit",
    "availability": "string or omit",
    "time_budget": "string or omit",
    "accountability_mode": "string or omit",
    "deadline": "YYYY-MM-DD or omit",
    "review_cycle": "string or omit",
    "tasks": [{{"name": "string", "requires_partner_review": true, "review_sla": "24h", "escalation_policy": "string"}}]
  }}
}}
Do not hallucinate missing fields.
""",
                expected_output="Strict JSON with extracted_slots only.",
                agent=analyst,
            )

            strategy_task = Task(
                description=f"""
Given current missing slots {json.dumps(missing_slots)}, propose exactly one next conversational question and up to 4 quick-reply chips.
Keep the question under 20 words.
Keep chips under 4 words each.

Return STRICT JSON only:
{{
  "next_prompt": "string",
  "quick_reply_chips": ["chip1", "chip2"]
}}
""",
                expected_output="Strict JSON with one next prompt and chips.",
                agent=strategist,
                context=[extraction_task],
            )

            crew = Crew(agents=[analyst, strategist], tasks=[extraction_task, strategy_task], process=Process.sequential, verbose=False)
            crew.kickoff()

            extracted_payload = self._safe_json_loads(extraction_task.output.raw)
            strategy_payload = self._safe_json_loads(strategy_task.output.raw)

            return {
                "extracted_slots": extracted_payload.get("extracted_slots", {}),
                "next_prompt": strategy_payload.get("next_prompt"),
                "quick_reply_chips": strategy_payload.get("quick_reply_chips", []),
            }
        except Exception as exc:
            logger.warning("GoalChatCrewOrchestrator.enrich_turn fallback due to error: %s", exc)
            return {"extracted_slots": {}, "next_prompt": None, "quick_reply_chips": []}

    @staticmethod
    def _safe_json_loads(raw: Any) -> Dict[str, Any]:
        if not isinstance(raw, str):
            return {}
        text = raw.strip().replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {}
