# backend/app/agents/user_profiler_agent.py

from typing import Dict, Any
from .tools import get_user_profile
from app.personalization.behavioral_analyzer import behavioral_analyzer
from app.personalization.context_engine import context_engine
from app.ai.gemini_model_manager import gemini_manager
from app.optimization.caching_strategy import caching_system
import json

class UserProfilerAgent:
    def __init__(self):
        self.get_user_profile_tool = get_user_profile
        self.behavioral_analyzer = behavioral_analyzer
        self.context_engine = context_engine
        self.caching_system = caching_system
        self.analysis_prompt_template = """
        You are an expert behavioral psychologist. Analyze the following comprehensive user profile, which includes raw metrics, behavioral patterns, and the user's stated intent for their new goal, to generate a final, synthesized user identity.

        USER'S STATED INTENT (GOAL CREATION CONTEXT):
        {goal_creation_context}

        RAW BEHAVIORAL METRICS & HISTORY (FROM PAST GOALS):
        {raw_profile}

        DETECTED BEHAVIORAL PATTERNS:
        {behavior_patterns}

        CURRENT CONTEXTUAL INSIGHTS:
        {contextual_insights}

        TASK: Create a final user identity profile in a structured JSON format.
        The JSON object must contain the following keys:
        - "thought": (String) Your detailed reasoning and thought process for the analysis.
        - "archetype": (String) One of "Newcomer", "Sprinter", "Marathoner", "Visionary", "Optimizer".
        - "archetype_confidence": (Float) Your confidence in this assessment, from 0.0 to 1.0.
        - "key_success_factors": (List[String]) The most critical factors for this user's success.
        - "risk_factors": (List[String]) The biggest risks to this user's success.
        """

    async def create_deep_profile(self, user_id: str, goal_creation_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a comprehensive user profile by orchestrating multiple analysis services,
        with a caching layer for performance.
        """
        print(f"AGENT: UserProfilerAgent starting deep profile for user {user_id}")
        goal_context_str = json.dumps(goal_creation_context)

        # 1. Check cache first
        cached_profile = self.caching_system.get_cached_user_profile(user_id, goal_context_str)
        if cached_profile:
            print(f"AGENT: UserProfilerAgent found cached profile for user {user_id}")
            return cached_profile

        # 2. If no cache, proceed with full analysis
        raw_profile = await self.get_user_profile_tool(user_id, goal_creation_context['goal_title'])
        behavior_patterns = self.behavioral_analyzer.analyze_micro_patterns(raw_profile)
        contextual_insights = await self.context_engine.generate_contextual_insights(raw_profile, goal_creation_context['goal_title'])

        prompt = self.analysis_prompt_template.format(
            goal_creation_context=goal_context_str,
            raw_profile=json.dumps(raw_profile, indent=2),
            behavior_patterns=json.dumps(behavior_patterns, indent=2, default=lambda o: o.__dict__),
            contextual_insights=json.dumps(contextual_insights, indent=2)
        )

        analysis_result = await gemini_manager.execute_with_model(
            model_type='pro',
            config_type='deep_analysis',
            prompt=prompt
        )

        if not analysis_result['success']:
            # Create a default profile and a metric object indicating failure
            fallback_profile = {"user_identity": {"archetype": "Newcomer"}, "behavioral_patterns": raw_profile, "contextual_insights": contextual_insights}
            metrics = {"thought": "Fell back to default profile due to Gemini API failure.", "cost": 0, "execution_time": analysis_result['execution_time'], "input_tokens": 0, "output_tokens": 0}
            return fallback_profile, metrics

        ai_content = analysis_result['content']
        thought = ai_content.pop('thought', "No thought provided.")
        
        deep_profile = {
            'user_identity': {
                'archetype': ai_content.get('archetype', 'Newcomer'),
                'archetype_confidence': ai_content.get('archetype_confidence', 0.5),
            },
            'behavioral_patterns': behavior_patterns,
            'contextual_insights': contextual_insights,
            'success_predictors': {
                'key_success_factors': ai_content.get('key_success_factors', []),
                'risk_factors': ai_content.get('risk_factors', [])
            },
        }
        
        # 3. Cache the new profile
        self.caching_system.cache_user_profile(user_id, goal_context_str, deep_profile)

        metrics = {
            "thought": thought,
            "cost": analysis_result.get('cost', 0),
            "execution_time": analysis_result.get('execution_time', 0),
            "input_tokens": analysis_result.get('input_tokens', 0),
            "output_tokens": analysis_result.get('output_tokens', 0),
        }

        return deep_profile, metrics

