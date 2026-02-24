# backend/app/services/duotrak_crew_orchestrator.py
from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool
from typing import Dict, List, Any, Optional
import asyncio
import time
import json
import logging
from datetime import datetime

from app.services.pinecone_service import PineconeService
from app.services.gemini_config import GeminiModelConfig
from app.schemas.agent_crew import DuotrakGoalPlan
from app.services.goal_creation_session_store import GoalCreationSessionStore
from app.core.redis_config import redis_client
from app.core.config import settings
from app.personalization.outcome_profile_store import OutcomeProfileStore
from app.personalization.context_engine import context_engine

logger = logging.getLogger(__name__)


def _allow_goal_session_memory_fallback() -> bool:
    env = str(getattr(settings, "ENVIRONMENT", "")).strip().lower()
    explicit = bool(getattr(settings, "GOAL_CREATION_ALLOW_IN_MEMORY_SESSION_FALLBACK", False))
    return explicit or env in {"development", "dev", "local"}


class UserHistoryTool(BaseTool):
    name: str = "User History Lookup"
    description: str = "Accesses a user's historical goal data, behavioral patterns, and past interactions from Duotrak's memory system."
    pinecone_service: PineconeService

    def _run(self, user_id: str) -> str:
        try:
            # This needs to run in a new event loop because CrewAI runs in a separate thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            context = loop.run_until_complete(self.pinecone_service.get_user_context(user_id, limit=10))
            return json.dumps(context, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error in UserHistoryTool: {str(e)}")
            return json.dumps({"error": "Could not retrieve user history", "user_id": user_id})

class DuotrakCrewOrchestrator:
    """Main orchestrator for the Duotrak Goal Creation Crew with a two-phase approach."""
    
    def __init__(
        self,
        pinecone_service: PineconeService,
        gemini_config: GeminiModelConfig,
        session_store: Optional[GoalCreationSessionStore] = None,
        session_ttl_seconds: int = 900,
    ):
        self.pinecone_service = pinecone_service
        self.gemini_config = gemini_config
        self.user_history_tool = UserHistoryTool(pinecone_service=pinecone_service)
        self.session_store = session_store or GoalCreationSessionStore(
            redis_client=redis_client,
            default_ttl_seconds=session_ttl_seconds,
            allow_in_memory_fallback=_allow_goal_session_memory_fallback(),
        )
        self.session_ttl_seconds = session_ttl_seconds
        self.outcome_profile_store = OutcomeProfileStore(pinecone_service)

    def _safe_json_loads(self, raw_output: str) -> Dict[str, Any]:
        """Safely loads JSON from a string, stripping markdown backticks."""
        if not isinstance(raw_output, str):
            return {}
        clean_json_str = raw_output.strip().replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(clean_json_str)
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse JSON from agent output: {clean_json_str}")
            return {}

    async def generate_strategic_questions(self, user_id: str, session_id: str, wizard_data: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        start_time = time.time()
        try:
            outcome_profile_payload = await self.outcome_profile_store.build_profile(user_id=user_id, days=90)
            outcome_profile = outcome_profile_payload.get("outcome_profile", {})
            contextual_insights = await context_engine.generate_contextual_insights(user_context, "goal_creation")
            enhanced_context = dict(user_context)
            enhanced_context["outcome_profile"] = outcome_profile
            enhanced_context["contextual_insights"] = context_engine.merge_outcome_profile(
                contextual_insights, outcome_profile
            )

            profiler, questioner = self._create_question_generation_agents()
            
            profiling_task = Task(
                description=f"""
                Analyze the user's wizard input and historical context to produce a compact profile.

                **Wizard Input:**
                {json.dumps(wizard_data, indent=2)}

                **Historical Context:**
                {json.dumps(enhanced_context, indent=2)}

                **IMPORTANT INSTRUCTION**
                First, check if the `historical_goals` list in the Historical Context is empty.
                - If it IS EMPTY, treat this as a NEW USER. Interpret `learning_confidence` as neutral baseline.
                - If it IS NOT EMPTY, analyze their past performance and confidence to identify patterns.

                Output STRICT JSON only:
                {{
                  "archetype": "2-4 words",
                  "key_motivators": ["short phrase", "short phrase"],
                  "risk_factors": ["short phrase", "short phrase"],
                  "confidence_level": 0.0
                }}
                Keep values concise. No paragraphs.
                """,
                expected_output="Strict JSON profile with concise fields and no prose.",
                agent=profiler
            )
            
            question_task = Task(
                description="""
                Based on the user profile, generate exactly 3 strategic questions.
                Rules:
                - Keep each question short and direct (<= 16 words).
                - Keep each context short (<= 12 words).
                - suggested_answers are examples only, not required user choices.
                - Include 3-4 suggested answers per question, each <= 8 words.
                - Avoid long paragraphs and avoid duplicate themes.

                Output STRICT JSON only:
                {
                  "questions": [
                    {
                      "question": "Short question text?",
                      "question_key": "snake_case_key",
                      "context": "Short reason",
                      "suggested_answers": ["Example", "Example", "Example"],
                      "allow_custom_answer": true
                    }
                  ]
                }
                """,
                expected_output="Strict JSON with exactly 3 concise questions and concise suggestion options.",
                agent=questioner,
                context=[profiling_task]
            )
            
            crew = Crew(
                agents=[profiler, questioner],
                tasks=[profiling_task, question_task],
                process=Process.sequential,
                verbose=False,
            )
            timeout_seconds = int(getattr(settings, "GOAL_QUESTIONS_TIMEOUT_SECONDS", 30))
            await asyncio.wait_for(asyncio.to_thread(crew.kickoff), timeout=timeout_seconds)
            
            execution_time_ms = (time.time() - start_time) * 1000
            
            profile_output = profiling_task.output.raw
            questions_output = question_task.output.raw
            
            await self.session_store.put(
                session_id,
                {
                    "user_id": user_id,
                    "wizard_data": wizard_data,
                    "user_context": enhanced_context,
                    "profile_output": profile_output,
                    "outcome_profile": outcome_profile,
                },
                ttl_seconds=self.session_ttl_seconds,
            )
            
            parsed_profile = self._safe_json_loads(profile_output)
            parsed_questions = self._safe_json_loads(questions_output)
            normalized_questions = self._normalize_questions(
                parsed_questions.get("questions", []),
                wizard_data=wizard_data,
                user_context=enhanced_context,
            )

            return {
                "user_profile_summary": parsed_profile if parsed_profile else self._create_fallback_profile(wizard_data),
                "questions": normalized_questions,
                "execution_time_ms": execution_time_ms
            }
        except asyncio.TimeoutError:
            execution_time_ms = (time.time() - start_time) * 1000
            logger.warning(
                "Strategic question generation timed out after %ss for user_id=%s; returning fallback questions.",
                int(getattr(settings, "GOAL_QUESTIONS_TIMEOUT_SECONDS", 30)),
                user_id,
            )
            return {
                "user_profile_summary": self._create_fallback_profile(wizard_data),
                "questions": self._create_fallback_questions(wizard_data, user_context),
                "execution_time_ms": execution_time_ms,
            }
        except Exception as e:
            logger.error(f"Error generating questions: {e}")
            return {"user_profile_summary": self._create_fallback_profile(wizard_data), "questions": self._create_fallback_questions(wizard_data, user_context), "execution_time_ms": 0}

    async def create_goal_plan_from_answers(self, session_id: str, user_id: str, answers: Dict[str, str]) -> Dict[str, Any]:
        start_time = time.time()
        session_data = await self.session_store.get(session_id)
        if session_data is None:
            raise ValueError("Session not found or expired. Please restart from strategic questions.")

        full_context = {**session_data, "strategic_answers": answers}
        
        try:
            strategist, critic, judge = self._create_goal_planning_agents()
            
            # V2 -> Inject the JSON schema directly into the prompt for the strategist
            plan_schema = DuotrakGoalPlan.model_json_schema()

            # Implement refinement loop
            approved_plan_str = ""
            critique_feedback = "No feedback yet. This is the first attempt."
            for i in range(3): # Max 3 iterations
                strategy_task = Task(
                    description=f"""
                    Create a hyper-personalized Duotrak goal plan using the full context.
                    Full Context: {json.dumps(full_context)}.
                    Previous Critique: {critique_feedback}.
                    
                    Planning priorities:
                    1) Optimize for long-term consistency over speed.
                    2) Encourage daily partner involvement in a flexible, non-blocking way.
                    3) Provide advisory picture-proof guidance for each task (not strict validation rules).

                    For every task include:
                    - description
                    - success_metric
                    - recommended_cadence
                    - recommended_time_windows (based on availability and time commitment)
                    - consistency_rationale
                    - partner_involvement:
                      - daily_check_in_suggestion
                      - weekly_anchor_review
                      - fallback_if_missed
                    - proof_guidance:
                      - what_counts (2-4 concise bullets)
                      - good_examples (2-3 concise bullets)
                      - avoid_examples (1-2 concise bullets)

                    **IMPORTANT**: You MUST format your output as a JSON object that strictly adheres to the following schema.
                    Do not include any markdown formatting.

                    **JSON Schema:**
                    {json.dumps(plan_schema, indent=2)}
                    """,
                    expected_output="A complete Duotrak goal plan as a structured JSON object that validates against the provided schema.",
                    agent=strategist
                )
                
                critique_task = Task(
                    description="Evaluate the generated goal plan. Respond with 'APPROVED: [reason]' or 'REJECTED: [reason]'.",
                    expected_output="An approval or rejection notice with clear reasoning.",
                    agent=critic,
                    context=[strategy_task]
                )

                crew = Crew(agents=[strategist, critic], tasks=[strategy_task, critique_task], process=Process.sequential)
                result = await asyncio.to_thread(crew.kickoff)
                
                critique_output = critique_task.output.raw
                if critique_output.strip().upper().startswith("APPROVED"):
                    approved_plan_str = strategy_task.output.raw
                    break
                else:
                    critique_feedback = critique_output
                    full_context["critique_feedback"] = critique_feedback # Add feedback for next iteration
            else: # If loop finishes without break
                 approved_plan_str = strategy_task.output.raw # Use the last plan

            scoring_task = Task(
                description=f"Provide a final quantitative evaluation of the approved plan. Plan: {approved_plan_str}",
                expected_output="A JSON object with a 'final_score' (a float between 0.0 and 10.0) and 'reasoning'.",
                agent=judge
            )
            
            judge_crew = Crew(agents=[judge], tasks=[scoring_task], process=Process.sequential)
            result = await asyncio.to_thread(judge_crew.kickoff)
            
            scoring_output = result.raw
            parsed_plan = self._safe_json_loads(approved_plan_str)
            scoring_data = self._safe_json_loads(scoring_output)

            execution_time_ms = (time.time() - start_time) * 1000
            
            return {
                "goal_plan": parsed_plan if parsed_plan else self._create_fallback_plan(full_context),
                "partner_integration": parsed_plan.get("partner_integration", {}) if parsed_plan else {},
                "personalization_score": scoring_data.get("final_score", 7.0),
                "execution_time_ms": execution_time_ms
            }
        except Exception as e:
            logger.error(f"Error creating goal plan: {e}", exc_info=True)
            # Ensure the fallback also has the correct structure
            fallback_plan = self._create_fallback_plan(full_context)
            return {
                "goal_plan": fallback_plan, 
                "partner_integration": fallback_plan.get("partner_integration", {}), 
                "personalization_score": 5.0, 
                "execution_time_ms": 0
            }

    def _create_question_generation_agents(self):
        profiler = Agent(role='User Profiling Specialist', goal='Analyze user data to create actionable behavioral profiles.', backstory='Expert in rapid user assessment.', llm=self.gemini_config.get_model_for_agent('user_profiling_specialist'), verbose=False)
        questioner = Agent(role='Strategic Question Designer', goal='Create insightful questions to maximize goal plan quality.', backstory='Master question designer.', llm=self.gemini_config.get_model_for_agent('strategic_question_designer'), verbose=False)
        return profiler, questioner

    def _create_goal_planning_agents(self):
        strategist = Agent(
            role='Duotrak Goal Strategist',
            goal='Design hyper-personalized goal plans optimized for sustainable consistency and partner accountability.',
            backstory='Master goal strategist for partner accountability systems. Balances ambition with durable routines and practical proof guidance.',
            llm=self.gemini_config.get_model_for_agent('goal_strategist'),
            verbose=True,
        )
        critic = Agent(role='Goal Plan Quality Critic', goal='Evaluate plans to ensure exceptional quality.', backstory='QA expert with an eye for what works.', llm=self.gemini_config.get_model_for_agent('critical_analyst'), verbose=True)
        judge = Agent(role='Goal Plan Quality Judge', goal='Provide accurate quantitative evaluation of goal plans.', backstory='Final arbiter of quality.', llm=self.gemini_config.get_model_for_agent('goal_plan_arbiter'), verbose=True)
        return strategist, critic, judge

    def _parse_user_profile_summary(self, profile_output: str) -> Dict[str, Any]:
        try:
            return json.loads(profile_output)
        except json.JSONDecodeError:
            return self._create_fallback_profile({})

    def _create_fallback_profile(self, wizard_data: Dict[str, Any]) -> Dict[str, Any]:
        return {"archetype": "Steady Climber", "key_motivators": ["Personal improvement"], "risk_factors": ["Time management"], "confidence_level": 0.7}

    def _create_fallback_questions(self, wizard_data: Dict[str, Any], user_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        goal = (wizard_data or {}).get("goal_description", "this goal")
        return [
            {
                "question": f"What is your most realistic daily slot for {goal}?",
                "question_key": "daily_time_slot",
                "context": "Locks your routine early.",
                "suggested_answers": ["Before work", "Lunch break", "Evening block", "Weekend morning"],
                "allow_custom_answer": True,
            },
            {
                "question": "What usually blocks you from staying consistent?",
                "question_key": "consistency_blocker",
                "context": "Prepares fallback actions.",
                "suggested_answers": ["Low energy", "Busy schedule", "Forgetfulness", "Low motivation"],
                "allow_custom_answer": True,
            },
            {
                "question": "How should your partner best support check-ins?",
                "question_key": "partner_support_style",
                "context": "Aligns accountability style.",
                "suggested_answers": ["Quick reminders", "Photo proof prompts", "Weekly recap", "Encouragement only"],
                "allow_custom_answer": True,
            },
        ]

    def _normalize_questions(
        self,
        raw_questions: Any,
        wizard_data: Dict[str, Any],
        user_context: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        if not isinstance(raw_questions, list):
            return self._create_fallback_questions(wizard_data, user_context)

        def _truncate(text: str, max_words: int) -> str:
            parts = (text or "").strip().split()
            if not parts:
                return ""
            if len(parts) <= max_words:
                return " ".join(parts)
            return " ".join(parts[:max_words]).rstrip(".,;:") + "..."

        def _snake_case(text: str, fallback: str) -> str:
            base = "".join(ch.lower() if ch.isalnum() else "_" for ch in (text or ""))
            parts = [p for p in base.split("_") if p]
            if not parts:
                return fallback
            return "_".join(parts[:4])

        normalized: List[Dict[str, Any]] = []
        for idx, item in enumerate(raw_questions[:3]):
            if not isinstance(item, dict):
                continue
            question = _truncate(str(item.get("question", "")).strip(), 16)
            context = _truncate(str(item.get("context", "")).strip(), 12)
            if not question:
                continue

            raw_suggestions = item.get("suggested_answers", [])
            suggestions: List[str] = []
            if isinstance(raw_suggestions, list):
                for s in raw_suggestions[:4]:
                    if not isinstance(s, str):
                        continue
                    short = _truncate(s.strip(), 8)
                    if short:
                        suggestions.append(short)

            if len(suggestions) < 3:
                fallback = self._create_fallback_questions(wizard_data, user_context)
                suggestions = fallback[min(idx, len(fallback) - 1)]["suggested_answers"]

            normalized.append(
                {
                    "question": question,
                    "question_key": _snake_case(
                        str(item.get("question_key", "")).strip(),
                        f"question_{idx + 1}",
                    ),
                    "context": context or "Helps personalize your plan.",
                    "suggested_answers": suggestions[:4],
                    "allow_custom_answer": True,
                }
            )

        if len(normalized) < 3:
            fallback = self._create_fallback_questions(wizard_data, user_context)
            for q in fallback:
                if len(normalized) >= 3:
                    break
                existing = {n["question_key"] for n in normalized}
                if q["question_key"] in existing:
                    continue
                normalized.append(q)

        return normalized[:3]

    def _create_fallback_plan(self, context: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "title": "Strategic Plan: Personal Goal",
            "description": "A consistency-first plan designed to keep momentum with flexible partner support.",
            "milestones": [
                {
                    "title": "Week 1 Foundation",
                    "description": "Establish a realistic routine and lock in a repeatable schedule.",
                    "tasks": [
                        {
                            "description": "Complete your first core session.",
                            "success_metric": "One completed session documented with a clear progress photo.",
                            "recommended_cadence": "3x per week",
                            "recommended_time_windows": ["Mon/Wed/Fri mornings"],
                            "consistency_rationale": "Three sessions per week is ambitious enough for progress but light enough to sustain.",
                            "partner_involvement": {
                                "daily_check_in_suggestion": "Send a quick update after each session.",
                                "weekly_anchor_review": "Sunday 10-minute recap together.",
                                "fallback_if_missed": "If a day is missed, shift to the next available slot without penalty.",
                            },
                            "proof_guidance": {
                                "what_counts": ["A clear photo showing task output or completion evidence."],
                                "good_examples": ["Photo of completed work artifact with timestamp context."],
                                "avoid_examples": ["Unclear or unrelated photos without context."],
                            },
                        }
                    ],
                }
            ],
            "success_metrics": ["Maintain planned cadence for the first two weeks."],
            "partner_accountability": {
                "role": "Supportive consistency partner",
                "check_in_schedule": "Daily encouraged, weekly anchor review",
                "shared_celebrations": "Celebrate weekly streaks and milestone completion",
            },
        }
