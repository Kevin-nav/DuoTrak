# backend/app/agents/question_agent.py

from typing import Dict, Any, List
from app.ai.gemini_model_manager import gemini_manager
import json

class QuestionAgent:
    def __init__(self):
        self.question_selection_prompt_template = """
        You are an expert life coach. Your task is to select the 3 most insightful and clarifying questions to ask a user before they start a new goal.

        USER PROFILE (from past behavior):
        {user_profile}

        USER'S NEW GOAL CONTEXT (from setup wizard):
        {goal_creation_context}

        QUESTION BANK (select from this list):
        - "What is your single biggest motivation for achieving this goal?"
        - "How much time can you realistically commit to this goal each week?"
        - "What is a potential obstacle you foresee, and how can your partner help you overcome it?"
        - "Do you plan to use any specific apps or tools for this goal (e.g., Duolingo, Strava)?"
        - "Based on your past successes, what is one strength you can leverage for this new goal?"
        - "How will you and your partner celebrate your first small win?"

        TASK: Based on the user's profile and their new goal context, select the 3 best questions. Return your answer as a JSON object with two keys: "thought" (a string explaining your reasoning) and "questions" (a list of strings).
        """

    async def select_optimal_questions(self, user_profile: Dict, goal_creation_context: Dict[str, Any]) -> (List[Dict], Dict):
        """
        Selects the most insightful questions using a Gemini model.
        """
        print(f"AGENT: QuestionAgent starting for user archetype: {user_profile['user_identity']['archetype']}")

        # 1. Create the prompt
        prompt = self.question_selection_prompt_template.format(
            user_profile=json.dumps(user_profile, indent=2, default=lambda o: o.__dict__),
            goal_creation_context=json.dumps(goal_creation_context, indent=2)
        )

        # 2. Call the Gemini model
        result = await gemini_manager.execute_with_model(
            model_type='flash',
            config_type='fast_classification',
            prompt=prompt
        )

        if not result['success']:
            print(f"ERROR: QuestionAgent failed to get questions from Gemini: {result['error']}")
            # Fallback to default questions and create a failure metric object
            fallback_questions = [
                {"question": "What is your primary motivation for this goal?", "key": "motivation"},
                {"question": "How much time can you realistically commit per week?", "key": "time_commitment"},
            ]
            metrics = {"thought": "Fell back to default questions due to Gemini API failure.", "cost": 0, "execution_time": result['execution_time'], "input_tokens": 0, "output_tokens": 0}
            return fallback_questions, metrics

        # 3. Format the questions and metrics
        ai_content = result['content']
        thought = ai_content.pop('thought', "No thought provided.")
        questions_list = ai_content.get('questions', [])
        formatted_questions = [{"question": q, "key": q.lower().replace(" ", "_")[:20]} for q in questions_list]
        
        metrics = {
            "thought": thought,
            "cost": result.get('cost', 0),
            "execution_time": result.get('execution_time', 0),
            "input_tokens": result.get('input_tokens', 0),
            "output_tokens": result.get('output_tokens', 0),
        }

        print(f"AGENT: QuestionAgent finished. Selected {len(formatted_questions)} questions.")
        return formatted_questions, metrics
