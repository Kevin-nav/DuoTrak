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

logger = logging.getLogger(__name__)

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
    
    def __init__(self, pinecone_service: PineconeService, gemini_config: GeminiModelConfig):
        self.pinecone_service = pinecone_service
        self.gemini_config = gemini_config
        self.user_history_tool = UserHistoryTool(pinecone_service=pinecone_service)
        self.active_sessions: Dict[str, Dict[str, Any]] = {}

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
            profiler, questioner = self._create_question_generation_agents()
            
            profiling_task = Task(
                description=f"""
                Analyze the user's wizard input and their historical context to create a concise behavioral profile.

                **Wizard Input:**
                {json.dumps(wizard_data, indent=2)}

                **Historical Context:**
                {json.dumps(user_context, indent=2)}

                **IMPORTANT INSTRUCTION:**
                First, check if the `historical_goals` list in the Historical Context is empty.
                - If it IS EMPTY, treat this as a NEW USER. Interpret the `learning_confidence` as a neutral starting point, not a sign of low confidence. Your analysis should focus on their stated goal and motivation.
                - If it IS NOT EMPTY, analyze their past performance and confidence to identify patterns.
                """,
                expected_output="A concise user behavioral profile including archetype, key motivators, and potential risks.",
                agent=profiler
            )
            
            question_task = Task(
                description="Based on the user profile, generate exactly 3 strategic questions with suggested answers to optimize goal planning.",
                expected_output="A JSON object containing a 'questions' list, where each item has 'question', 'question_key', 'context', and 'suggested_answers'.",
                agent=questioner,
                context=[profiling_task]
            )
            
            crew = Crew(agents=[profiler, questioner], tasks=[profiling_task, question_task], process=Process.sequential)
            result = await asyncio.to_thread(crew.kickoff)
            
            execution_time_ms = (time.time() - start_time) * 1000
            
            profile_output = profiling_task.output.raw
            questions_output = question_task.output.raw
            
            self.active_sessions[session_id] = {"user_id": user_id, "wizard_data": wizard_data, "user_context": user_context, "profile_output": profile_output}
            
            parsed_profile = self._safe_json_loads(profile_output)
            parsed_questions = self._safe_json_loads(questions_output)

            return {
                "user_profile_summary": parsed_profile if parsed_profile else self._create_fallback_profile(wizard_data),
                "questions": parsed_questions.get("questions", self._create_fallback_questions(wizard_data, user_context)),
                "execution_time_ms": execution_time_ms
            }
        except Exception as e:
            logger.error(f"Error generating questions: {e}")
            return {"user_profile_summary": self._create_fallback_profile(wizard_data), "questions": self._create_fallback_questions(wizard_data, user_context), "execution_time_ms": 0}

    async def create_goal_plan_from_answers(self, session_id: str, user_id: str, answers: Dict[str, str]) -> Dict[str, Any]:
        start_time = time.time()
        if session_id not in self.active_sessions:
            raise ValueError("Session not found.")
        
        session_data = self.active_sessions[session_id]
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
        profiler = Agent(role='User Profiling Specialist', goal='Analyze user data to create actionable behavioral profiles.', backstory='Expert in rapid user assessment.', llm=self.gemini_config.get_model_for_agent('user_profiling_specialist'), verbose=True)
        questioner = Agent(role='Strategic Question Designer', goal='Create insightful questions to maximize goal plan quality.', backstory='Master question designer.', llm=self.gemini_config.get_model_for_agent('strategic_question_designer'), verbose=True)
        return profiler, questioner

    def _create_goal_planning_agents(self):
        strategist = Agent(role='Duotrak Goal Strategist', goal='Design hyper-personalized goal plans.', backstory='Master goal strategist for partner accountability systems.', llm=self.gemini_config.get_model_for_agent('goal_strategist'), verbose=True)
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
        return [{"question": "What's the biggest obstacle you anticipate?", "question_key": "biggest_obstacle", "context": "Helps create proactive solutions.", "suggested_answers": ["Finding time", "Staying motivated"]}]

    def _create_fallback_plan(self, context: Dict[str, Any]) -> Dict[str, Any]:
        return {"title": "Strategic Plan: Personal Goal", "description": "A personalized plan to help you achieve your goal.", "category": "personal", "difficulty_level": 0.6, "estimated_duration_days": 30, "weekly_tasks": [], "daily_habits": [], "milestone_markers": [], "partner_integration": {}, "motivation_anchors": [], "risk_mitigation": []}
