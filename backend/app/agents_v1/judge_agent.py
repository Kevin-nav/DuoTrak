# backend/app/agents/judge_agent.py

from typing import Dict, Any
from app.ai.gemini_model_manager import gemini_manager
import json

class JudgeAgent:
    def __init__(self):
        self.evaluation_prompt_template = """
        You are an expert quality assurance tester for an AI life coach. Your task is to evaluate a generated goal plan based on the user's profile, original goal, and answers to clarifying questions. You must be objective and strictly follow the rubric.

        **1. User Profile:**
        {user_profile}

        **2. Original Goal Context:**
        {goal_context}

        **3. User's Answers to Questions:**
        {user_answers}

        **4. The Generated Goal Plan to Evaluate:**
        {plan}

        **EVALUATION RUBRIC:**
        Evaluate the plan against the following criteria on a scale of 1 to 10.

        - **Personalization (1-10):** How well does the plan reflect the user's specific archetype, behavioral patterns, and answers? (1 = generic, 10 = deeply personalized).
        - **Actionability (1-10):** Are the tasks clear, specific, and realistically achievable for this user? (1 = vague and impossible, 10 = crystal clear and highly achievable).
        - **Completeness (1-10):** Does the plan contain all required elements (a motivating title, description, 3-5 tasks, and success tips)? (1 = missing most elements, 10 = all elements present and well-crafted).
        - **Alignment (1-10):** How well does the final plan address the user's original goal context? (1 = completely irrelevant, 10 = perfectly aligned).

        **TASK:**
        Provide your evaluation in a structured JSON format. The JSON object must contain:
        - A `scores` object with keys for `personalization`, `actionability`, `completeness`, and `alignment`.
        - A `final_score` which is the weighted average of the scores (Personalization: 40%, Actionability: 30%, Alignment: 20%, Completeness: 10%).
        - A `thought` string that provides a brief, objective justification for your scores, highlighting specific strengths and weaknesses.
        """

    async def evaluate_plan(self, user_profile: Dict, goal_context: str, user_answers: Dict, plan: Dict) -> (Dict[str, Any], Dict):
        """Evaluates a generated goal plan using the rubric."""
        print("AGENT: JudgeAgent starting evaluation.")

        prompt = self.evaluation_prompt_template.format(
            user_profile=json.dumps(user_profile, indent=2, default=lambda o: o.__dict__),
            goal_context=goal_context,
            user_answers=json.dumps(user_answers, indent=2),
            plan=json.dumps(plan, indent=2)
        )

        result = await gemini_manager.execute_with_model(
            model_type='flash', # Use the faster model for evaluation
            config_type='critical_analysis',
            prompt=prompt
        )

        if not result['success']:
            print(f"ERROR: JudgeAgent failed to get evaluation from Gemini: {result['error']}")
            # Default to a failing score if the judge fails
            fallback_eval = {"final_score": 0, "thought": "Judge agent failed to execute."}
            metrics = {"thought": fallback_eval["thought"], "cost": 0, "execution_time": result['execution_time'], "input_tokens": 0, "output_tokens": 0}
            return fallback_eval, metrics

        ai_content = result['content']
        thought = ai_content.get('thought', "No thought provided.")
        evaluation = ai_content

        metrics = {
            "thought": thought,
            "cost": result.get('cost', 0),
            "execution_time": result.get('execution_time', 0),
            "input_tokens": result.get('input_tokens', 0),
            "output_tokens": result.get('output_tokens', 0),
        }

        print(f"AGENT: JudgeAgent finished. Final Score: {evaluation.get('final_score')}")
        return evaluation, metrics
