import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.schemas.goal import GoalSuggestionRequest, SuggestedTask, GoalSuggestionResponse
from app.db.models.user import User

logger = logging.getLogger(__name__)

class AISuggestionService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")
        self.max_retries = int(os.getenv("GEMINI_MAX_RETRIES", "3"))
        self.timeout = int(os.getenv("GEMINI_TIMEOUT", "30"))
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.model_name)
    
    def _build_user_context(self, user: User) -> Dict[str, Any]:
        """Build user context for AI prompt personalization."""
        return {
            "timezone": user.timezone,
            "current_streak": user.current_streak,
            "longest_streak": user.longest_streak,
            "total_tasks_completed": user.total_tasks_completed,
            "goals_conquered": user.goals_conquered,
            "experience_level": self._determine_experience_level(user),
            "success_patterns": self._analyze_user_patterns(user)
        }
    
    def _determine_experience_level(self, user: User) -> str:
        """Determine user's experience level based on their history."""
        if user.goals_conquered >= 10 and user.total_tasks_completed >= 100:
            return "Expert"
        elif user.goals_conquered >= 3 and user.total_tasks_completed >= 30:
            return "Intermediate"
        elif user.goals_conquered >= 1 or user.total_tasks_completed >= 10:
            return "Beginner"
        else:
            return "Newcomer"
    
    def _analyze_user_patterns(self, user: User) -> str:
        """Analyze user success patterns for better recommendations."""
        if user.longest_streak > 30:
            return "Shows strong consistency and long-term commitment"
        elif user.longest_streak > 7:
            return "Demonstrates good habit-forming ability"
        elif user.current_streak > user.longest_streak and user.current_streak > 3:
            return "Currently building momentum"
        else:
            return "Benefits from structured, step-by-step approach"
    
    def _create_enhanced_prompt(self, request: GoalSuggestionRequest, user_context: Dict[str, Any]) -> str:
        """Create a comprehensive, high-quality prompt for Gemini to act as a Habit Coach."""
        
        prompt = f"""//-- ROLE & PERSONA --//
You are DuoTrak's Expert Habit Coach, a specialized AI with a deep understanding of behavioral psychology and habit formation. Your tone is encouraging, clear, and highly practical. You do not use business jargon. You are here to help a user turn a high-level goal into a concrete, actionable plan of repeatable micro-habits.

//-- CORE DIRECTIVE --//
Your primary directive is to analyze a user's goal and generate a Habit Formation Plan. This plan consists of two key components:
1. A classification of the goal's type.
2. A list of atomic, repeatable tasks designed to build momentum and consistency.

//-- PERSONALIZATION PRINCIPLES --//
This is not a generic plan. You MUST tailor it to the user's specific context.
- **Analyze Availability:** Use the user's `availability` (e.g., "Mornings (6-9 AM)") to suggest tasks for that specific time of day. For example, a task could be named "Morning French Review."
- **Respect Time Commitment:** The duration and intensity of the tasks should align with the user's stated `time_commitment`.
- **Leverage Motivation:** The task descriptions should be encouraging and connect back to the user's `motivation` to reinforce their "why."

//-- STEP-BY-STEP EXECUTION --//
**STEP 1: Analyze and Classify the Goal**
Based on the user's goal and motivation, first classify it as one of two types:
*   `Project`: A goal with a finite, measurable end-point. (e.g., "Run a 5K," "Build a website," "Finish a book").
*   `Habit`: A goal that is an ongoing lifestyle change or skill acquisition. (e.g., "Learn French," "Exercise regularly," "Eat healthier").

**STEP 2: Generate the Habit Loop Tasks**
Generate a list of 3 to 5 micro-habits. These are NOT a one-time checklist. They are small, repeatable actions that form a habit loop (cue, routine, reward).

**TASK DESIGN PRINCIPLES:**
*   **Atomicity:** Each task must be small enough to be completed in 5-30 minutes. It should feel easy to start.
*   **Action-Oriented:** Start each task name with a verb (e.g., "Practice," "Review," "Walk," "Write").
*   **Frequency is Key:** For each task, you MUST provide a `repeat_frequency`. This is the most critical part of the task. Be specific: 'Daily', 'Every weekday', '3 times a week', 'Weekly'.
*   **Avoid Onboarding:** Do NOT create tasks like "Download an app" or "Set up an account." Assume the user can do that themselves. Focus on the recurring actions.
*   **Contextual Naming:** Name tasks specifically when possible. Instead of "Practice French," a better task for a user available in the evening would be "Evening French Practice."

**STEP 3: Provide Encouraging Success Tips**
Generate 2-3 short, encouraging tips that are relevant to the user's goal and the principles of habit formation.

//-- OUTPUT CONTRACT: STRICT JSON ONLY --//
You MUST return ONLY a valid JSON object. Do not include markdown, comments, or any text outside the JSON structure.

**JSON STRUCTURE:**
```json
{{
  "goal_type": "<'Project' or 'Habit'>",
  "tasks": [
    {{
      "task_name": "<The clear, action-oriented, repeatable task>",
      "description": "<A brief, encouraging explanation of the task>",
      "repeat_frequency": "<'Daily', 'Every weekday', '3 times a week', etc.>"
    }}
  ],
  "success_tips": [
    "<Short, encouraging tip 1>",
    "<Short, encouraging tip 2>"
  ]
}}
```

//-- USER DATA FOR ANALYSIS --//
- **User's Goal:** {request.goal_name}
- **User's Motivation:** {request.motivation}
- **User's Availability:** {', '.join(request.availability)}
- **User's Time Commitment:** {request.time_commitment}
"""
        
        return prompt
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((Exception,))
    )
    async def _call_gemini_api(self, prompt: str) -> Dict[str, Any]:
        """Make API call to Gemini with retry logic."""
        try:
            logger.info("Making Gemini API request")
            
            generation_config = genai.types.GenerationConfig(
                temperature=0.7,
                top_p=0.8,
                top_k=40,
                max_output_tokens=2048,
                response_mime_type="application/json"
            )
            
            response = await self.model.generate_content_async(
                prompt,
                generation_config=generation_config
            )
            
            if not response.text:
                raise ValueError("Empty response from Gemini API")
            
            try:
                result = json.loads(response.text)
                logger.info("Successfully parsed Gemini response")
                return result
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                logger.error(f"Raw response: {response.text}")
                raise ValueError("Invalid JSON response from AI model")
                
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            raise
    
    def _validate_ai_response(self, ai_response: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean AI response based on the new Habit Coach schema."""
        try:
            if "goal_type" not in ai_response or ai_response["goal_type"] not in ["Project", "Habit"]:
                raise ValueError("Response missing or has invalid 'goal_type'")

            if "tasks" not in ai_response or not isinstance(ai_response["tasks"], list) or not (3 <= len(ai_response["tasks"]) <= 5):
                raise ValueError("Response must have 3-5 tasks")
            
            for i, task in enumerate(ai_response["tasks"]):
                required_fields = ["task_name", "description", "repeat_frequency"]
                for field in required_fields:
                    if field not in task:
                        raise ValueError(f"Task {i+1} missing required field: {field}")
            
            if "success_tips" not in ai_response or not isinstance(ai_response["success_tips"], list):
                ai_response["success_tips"] = [
                    "Start with small, consistent actions.",
                    "Track your progress regularly.",
                    "Celebrate small wins along the way."
                ]
            
            return ai_response
            
        except Exception as e:
            logger.error(f"AI response validation error: {str(e)}")
            raise ValueError(f"Invalid AI response format: {str(e)}")
    
    async def generate_task_suggestions(
        self, 
        request: GoalSuggestionRequest, 
        user: User
    ) -> GoalSuggestionResponse:
        """Main method to generate task suggestions."""
        try:
            logger.info(f"Generating suggestions for user {user.id}, goal: {request.goal_name[:50]}...")
            
            user_context = self._build_user_context(user)
            prompt = self._create_enhanced_prompt(request, user_context)
            ai_response = await self._call_gemini_api(prompt)
            validated_response = self._validate_ai_response(ai_response)
            
            response = GoalSuggestionResponse(
                goal_type=validated_response["goal_type"],
                tasks=[SuggestedTask(**task) for task in validated_response["tasks"]],
                success_tips=validated_response["success_tips"],
                generated_at=datetime.now(timezone.utc).isoformat(),
                model_version=self.model_name
            )
            
            logger.info(f"Successfully generated {len(response.tasks)} task suggestions")
            return response
            
        except Exception as e:
            logger.error(f"Error generating task suggestions: {str(e)}")
            return self._create_fallback_response(request)
    
    def _create_fallback_response(self, request: GoalSuggestionRequest) -> GoalSuggestionResponse:
        """Create a fallback response when AI fails, conforming to the new schema."""
        fallback_tasks = [
            SuggestedTask(
                task_name="Break Down Your Goal",
                description="Identify the first small, repeatable step you can take towards your goal.",
                repeat_frequency="Daily"
            ),
            SuggestedTask(
                task_name="Schedule Your Habit",
                description="Assign a specific time and day for your new habit to create a routine.",
                repeat_frequency="Daily"
            ),
            SuggestedTask(
                task_name="Review Your Progress Weekly",
                description="Once a week, look back at what you have accomplished and adjust your plan.",
                repeat_frequency="Weekly"
            )
        ]
        
        return GoalSuggestionResponse(
            goal_type="Habit",
            tasks=fallback_tasks,
            success_tips=[
                "Start with a task so small you can't say no.",
                "Track your progress visually.",
                "Celebrate consistency over intensity."
            ],
            generated_at=datetime.now(timezone.utc).isoformat(),
            model_version="fallback"
        )

    def _create_onboarding_prompt(self, request: 'OnboardingGoalPlanRequest', user: User) -> str:
        """Create a specialized prompt for the onboarding experience."""
        
        prompt = f"""//-- ROLE & PERSONA --//
You are DuoTrak's Onboarding Specialist, an AI focused on creating a perfect *first* goal plan for a new user and their partner. Your tone is exceptionally welcoming, simple, and motivating. You are setting the stage for their entire journey.

//-- CORE DIRECTIVE --//
Your goal is to take a high-level goal idea and the user's specific context to create an inspiring and, most importantly, *achievable* 30-day starter plan. The plan should feel like a fun challenge, not a chore.

//-- PERSONALIZATION PRINCIPLES --//
This is the user's first impression. You MUST use the contextual answers to make the plan feel tailor-made.
- **Analyze Context:** The `contextual_answers` provide the key to personalization. Use them directly in your reasoning and suggestions.
- **Focus on Collaboration:** Frame the tasks and tips around doing things *together* with their partner.
- **Simplicity is Key:** The first plan should be simple. Focus on 2-3 core tasks that build a foundation.

//-- STEP-BY-STEP EXECUTION --//
**STEP 1: Classify the Goal**
Classify the goal as either `Project` (finite end) or `Habit` (ongoing).

**STEP 2: Generate Starter Tasks**
Generate a list of 2 to 3 starter tasks. These tasks should be the first logical steps for the chosen goal, personalized with the user's context.

**TASK DESIGN PRINCIPLES:**
*   **Welcoming:** The first task should be very easy, like "Plan your first cooking night together."
*   **Action-Oriented:** Start each task name with a verb.
*   **Clear Frequency:** Provide a `repeat_frequency` for each task (e.g., 'Once this week', 'Every Sunday', 'Twice a week').

**STEP 3: Provide "First Victory" Tips**
Generate 2-3 success tips focused on achieving their first win and building early momentum together.

//-- OUTPUT CONTRACT: STRICT JSON ONLY --//
You MUST return ONLY a valid JSON object.

**JSON STRUCTURE:**
```json
{{
  "goal_type": "<'Project' or 'Habit'>",
  "tasks": [
    {{
      "task_name": "<The clear, welcoming, and repeatable task>",
      "description": "<A brief, encouraging explanation of the task, mentioning the partner>",
      "repeat_frequency": "<'Once this week', 'Daily', 'Every Sunday', etc.>"
    }}
  ],
  "success_tips": [
    "<Short, encouraging tip 1 focused on teamwork>",
    "<Short, encouraging tip 2 focused on the first week>"
  ]
}}
```

//-- USER DATA FOR ANALYSIS --//
- **Chosen Goal Title:** {request.goal_title}
- **Goal Description:** {request.goal_description}
- **User's Contextual Answers:** {request.contextual_answers}
- **Partner's Name:** {user.partner_full_name or 'your partner'}
"""
        
        return prompt

    async def generate_onboarding_plan(
        self,
        request: 'OnboardingGoalPlanRequest',
        user: User
    ) -> GoalSuggestionResponse:
        """Main method to generate an onboarding goal plan."""
        try:
            logger.info(f"Generating onboarding plan for user {user.id}, goal: {request.goal_title[:50]}...")
            
            prompt = self._create_onboarding_prompt(request, user)
            ai_response = await self._call_gemini_api(prompt)
            validated_response = self._validate_ai_response(ai_response)
            
            response = GoalSuggestionResponse(
                goal_type=validated_response["goal_type"],
                tasks=[SuggestedTask(**task) for task in validated_response["tasks"]],
                success_tips=validated_response["success_tips"],
                generated_at=datetime.now(timezone.utc).isoformat(),
                model_version=self.model_name
            )
            
            logger.info(f"Successfully generated {len(response.tasks)} tasks for onboarding plan")
            return response
            
        except Exception as e:
            logger.error(f"Error generating onboarding plan: {str(e)}")
            # Fallback for onboarding can be simpler
            return self._create_fallback_response(GoalSuggestionRequest(
                goal_type='personal',
                goal_name=request.goal_title,
                motivation='To get started on a new journey!',
                availability=['anytime'],
                time_commitment='short',
                accountability_type='visual_proof'
            ))

ai_suggestion_service = AISuggestionService()
