# backend/app/agents/goal_strategist_agent.py

from typing import Dict, Any, Optional
from app.ai.gemini_model_manager import gemini_manager
import json

class GoalStrategistAgent:
    def __init__(self):
        self.plan_generation_prompt_template = """
        You are an expert goal strategist and life coach. Your task is to create a hyper-personalized, motivating, and achievable goal plan for a user.

        **1. USER PROFILE (from past behavior):**
        {user_profile}

        **2. USER'S NEW GOAL CONTEXT (from setup wizard):**
        {goal_creation_context}

        **3. USER'S ANSWERS TO CLARIFYING QUESTIONS:**
        {user_answers}

        **4. PREVIOUS ATTEMPT (if applicable):**
        {critique_section}

        **TASK:** Create a comprehensive goal plan in a structured JSON format.
        The JSON object must contain the following keys:
        - "title": (String) A motivating title for the goal.
        - "description": (String) A brief, inspiring description of the goal.
        - "category": (String) The most relevant category for this goal.
        - "difficulty_level": (Float) A score from 0.1 to 1.0, based on the user's profile and the goal's nature.
        - "estimated_duration_days": (Integer) An appropriate duration for the goal based on the context. Do NOT default to 30 days; choose a realistic timeframe.
        - "tasks": (List[Object]) A list of 3-5 specific, actionable tasks. Each task object should have "task_name", "description", and "repeat_frequency".
        - "success_tips": (List[String]) A list of 2-3 personalized success tips.
        - "partner_involvement_suggestions": (List[String]) A list of 1-2 suggestions for how their partner can help.

        **INSTRUCTIONS:**
        - Use all the provided data to make the plan as personalized as possible.
        - The tasks you create MUST respect the user's stated `availability` and `time_commitment` from their goal context.
        - Reference the user's archetype and behavioral patterns in your suggestions.
        - If the user mentioned an external app, integrate it into the tasks.
        - Frame the plan collaboratively, mentioning the partner.
        """

    async def generate_plan(self, user_profile: Dict, goal_creation_context: Dict[str, Any], user_answers: Dict, critique: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Generates a hyper-personalized goal plan using a Gemini model, optionally refining it based on a critique.
        """
        print(f"AGENT: GoalStrategistAgent starting for user archetype: {user_profile['user_identity']['archetype']}")

        critique_section = ""
        if critique:
            print("AGENT: GoalStrategistAgent received critique for refinement.")
            critique_section = f"""
            A previous version of this plan was rejected. You MUST address the following critique in your new plan:
            CRITIQUE: {critique.get('reasoning', 'No reasoning provided.')}
            """

        # 1. Create the prompt
        prompt = self.plan_generation_prompt_template.format(
            user_profile=json.dumps(user_profile, indent=2, default=lambda o: o.__dict__),
            goal_creation_context=json.dumps(goal_creation_context, indent=2),
            user_answers=json.dumps(user_answers, indent=2),
            critique_section=critique_section
        )

        # 2. Call the Gemini model
        result = await gemini_manager.execute_with_model(
            model_type='pro',
            config_type='creative_generation',
            prompt=prompt
        )

        if not result['success']:
            print(f"ERROR: GoalStrategistAgent failed to get plan from Gemini: {result['error']}")
            # Fallback to a simple plan
            return {"title": goal_creation_context['goal_title'], "description": "A simple plan to get you started.", "tasks": []}

        print(f"AGENT: GoalStrategistAgent finished.")
        return result['content']
