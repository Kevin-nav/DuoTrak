# backend/app/agents/critic_agent.py

from typing import Dict, Any
from app.ai.gemini_model_manager import gemini_manager
import json

class CriticAgent:
    def __init__(self):
        self.review_prompt_template = """
        You are a meticulous and critical life coach. Your task is to review a proposed goal plan and ensure it is high-quality and perfectly aligned with the user's profile.

        USER PROFILE:
        {user_profile}

        PROPOSED GOAL PLAN:
        {plan}

        TASK: Review the plan. If it is excellent and perfectly aligned with the user's archetype and behavioral patterns, respond with a JSON object: `{{"status": "APPROVED", "thought": "Your brief reasoning and thought process here."}}`.
        
        If the plan has flaws, respond with a JSON object: `{{"status": "REJECTED", "thought": "Your detailed, constructive critique and thought process here. Explain WHY it's a bad fit and suggest specific improvements."}}`
        """

    async def review_plan(self, plan: Dict, user_profile: Dict, goal_creation_context: Dict[str, Any], user_answers: Dict) -> (Dict[str, Any], Dict):
        """
        Reviews a goal plan for coherence and alignment with the user's profile and original intent.
        """
        print(f"AGENT: CriticAgent starting review for user archetype: {user_profile['user_identity']['archetype']}")

        # 1. Create the prompt
        prompt = self.review_prompt_template.format(
            user_profile=json.dumps(user_profile, indent=2, default=lambda o: o.__dict__),
            goal_creation_context=json.dumps(goal_creation_context, indent=2),
            user_answers=json.dumps(user_answers, indent=2),
            plan=json.dumps(plan, indent=2)
        )

        # 2. Call the Gemini model
        result = await gemini_manager.execute_with_model(
            model_type='flash',
            config_type='critical_analysis',
            prompt=prompt
        )

        if not result['success']:
            print(f"ERROR: CriticAgent failed to get review from Gemini: {result['error']}")
            # Default to approving the plan if the critic fails
            fallback_critique = {"status": "APPROVED", "thought": "Critic agent failed; defaulting to approval."}
            metrics = {"thought": fallback_critique["thought"], "cost": 0, "execution_time": result['execution_time'], "input_tokens": 0, "output_tokens": 0}
            return fallback_critique, metrics

        ai_content = result['content']
        thought = ai_content.get('thought', "No thought provided.")
        critique = ai_content

        metrics = {
            "thought": thought,
            "cost": result.get('cost', 0),
            "execution_time": result.get('execution_time', 0),
            "input_tokens": result.get('input_tokens', 0),
            "output_tokens": result.get('output_tokens', 0),
        }

        print(f"AGENT: CriticAgent finished. Status: {critique.get('status')}")
        return critique, metrics
