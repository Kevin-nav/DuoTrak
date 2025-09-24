# backend/app/agents/goal_coach_orchestrator.py

from typing import Dict, Any, List
from .user_profiler_agent import UserProfilerAgent
from .question_agent import QuestionAgent
from .goal_strategist_agent import GoalStrategistAgent
from .critic_agent import CriticAgent

class GoalCoachOrchestrator:
    def __init__(self):
        self.user_profiler = UserProfilerAgent()
        self.question_agent = QuestionAgent()
        self.goal_strategist = GoalStrategistAgent()
        self.critic_agent = CriticAgent()

    async def generate_initial_questions(self, user_id: str, goal_creation_context: Dict[str, Any]) -> List[Dict]:
        """
        First step of the process: generate the initial clarifying questions.
        """
        print("ORCHESTRATOR: Starting question generation phase.")
        user_profile = await self.user_profiler.create_deep_profile(user_id, goal_creation_context)
        questions = await self.question_agent.select_optimal_questions(user_profile, goal_creation_context)
        print("ORCHESTRATOR: Question generation phase complete.")
        return questions, user_profile

    async def generate_final_plan(self, user_profile: Dict, goal_creation_context: Dict[str, Any], user_answers: Dict) -> Dict[str, Any]:
        """
        Second step of the process: generate the final, reviewed plan.
        """
        print("ORCHESTRATOR: Starting final plan generation phase (Comprehensive Path).")
        
        plan = None
        critique = None
        for i in range(2): # Max 2 attempts
            plan = await self.goal_strategist.generate_plan(user_profile, goal_creation_context, user_answers, critique=critique)
            critique = await self.critic_agent.review_plan(plan, user_profile, goal_creation_context, user_answers)

            if critique.get("status") == "APPROVED":
                print("ORCHESTRATOR: Plan approved.")
                return plan
            else:
                print(f"ORCHESTRATOR: Plan needs refinement. Retrying... Critique: {critique.get('reasoning')}")
        
        print("ORCHESTRATOR: Final plan generation phase complete.")
        return plan # Return the last plan even if not approved after retries
