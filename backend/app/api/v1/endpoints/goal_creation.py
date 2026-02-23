# backend/app/api/v1/endpoints/goal_creation.py
import asyncio
import logging
import uuid
import hmac
from fastapi import APIRouter, HTTPException, Request, status

from app.core.config import settings
from app.core.logging_config import emit_goal_operation_event
from app.schemas.agent_crew import GoalWizardRequest, QuestionsResponse, AnswersSubmissionRequest, GoalPlanResponse, OnboardingPlanRequest, OnboardingPlanResponse, OnboardingPlanTask
from app.services.gemini_config import GeminiModelConfig
from app.services.pinecone_service import PineconeService
from app.services.goal_creation_session_store import GoalCreationSessionStore
from app.services.goal_plan_adapter import adapt_goal_plan_response
from app.core.redis_config import redis_client
from app.ai.orchestrator_factory import create_orchestrator
from app.ai.shadow_runner import ShadowRunner
from app.services.external_judge_crew import ExternalJudgeCrew
from app.schemas.agent_crew import DuotrakGoalPlan
from fastapi import BackgroundTasks
import json

router = APIRouter()
logger = logging.getLogger(__name__)
from app.services.gemini_service import gemini_service

def _is_internal_request(request: Request) -> bool:
    internal_api_key = request.headers.get("X-Internal-API-Key")
    if not internal_api_key:
        return False
    return hmac.compare_digest(internal_api_key, settings.INTERNAL_API_SECRET)


def _allow_dev_browser_goal_creation(request: Request) -> bool:
    """
    Development-only escape hatch for local browser-driven goal creation calls.
    This is intentionally restricted to localhost origins and non-production env.
    """
    if str(getattr(settings, "ENVIRONMENT", "")).lower() not in {"development", "dev", "local"}:
        return False
    origin = (request.headers.get("origin") or "").lower()
    return origin in {"http://localhost:3000", "http://127.0.0.1:3000"}

def run_evaluation_in_background(plan: DuotrakGoalPlan):
    """The function that will be run in the background."""
    try:
        logger.info("--- Starting Background Evaluation of Goal Plan ---")
        # We need a path for the test dataset, even if it's not used for this specific evaluation method
        # We can create a dummy file or point to the existing one.
        # For now, let's assume a path.
        test_dataset_path = "test_dataset.json" 
        judge_crew = ExternalJudgeCrew(gemini_config=gemini_config, test_dataset_path=test_dataset_path)
        
        # The evaluate_goal_plan_phase expects a 'golden_plan' and 'simulated_answers'.
        # For this live evaluation, we don't have a golden plan.
        # We will pass the generated plan as both generated and golden to see the output.
        # This is for logging and developer review, not for scoring.
        asyncio.run(judge_crew.evaluate_goal_plan_phase(
            generated_plan=plan.dict(),
            golden_plan=plan.dict(), # Using the same plan for comparison
            simulated_answers={} # No answers available in this context
        ))
        logger.info("--- Background Evaluation of Goal Plan Finished ---")
    except Exception as e:
        logger.error(f"--- Background Evaluation Failed: {e} ---", exc_info=True)

@router.post("/evaluate-plan", status_code=status.HTTP_202_ACCEPTED)
async def evaluate_plan_endpoint(
    plan: DuotrakGoalPlan,
    background_tasks: BackgroundTasks
):
    """
    Development-only endpoint to trigger a background evaluation of a generated goal plan.
    This does not block the client and is used for logging and quality assurance.
    """
    logger.info("Received request to evaluate plan in background.")
    emit_goal_operation_event(
        "goal_plan_evaluation_requested",
        plan_title=plan.title,
        milestone_count=len(plan.milestones),
    )
    background_tasks.add_task(run_evaluation_in_background, plan)
    return {"message": "Evaluation has been triggered in the background."}

# Initialize services
gemini_config = GeminiModelConfig()

pinecone_service = PineconeService(
    api_key=settings.PINECONE_API_KEY,
    environment="aws",  # This should be configured in settings
    index_name=settings.PINECONE_INDEX_NAME
)

duotrak_orchestrator = create_orchestrator(
    settings=settings,
    pinecone_service=pinecone_service,
    gemini_config=gemini_config,
    session_store=GoalCreationSessionStore(
        redis_client=redis_client,
        default_ttl_seconds=getattr(settings, "GOAL_CREATION_SESSION_TTL_SECONDS", 900),
    ),
)


class _ShadowSettings:
    def __init__(self, orchestrator_name: str, ttl_seconds: int) -> None:
        self.AI_ORCHESTRATOR = orchestrator_name
        self.GOAL_CREATION_SESSION_TTL_SECONDS = ttl_seconds


def _resolve_shadow_orchestrator():
    shadow_name = str(getattr(settings, "AI_SHADOW_ORCHESTRATOR", "")).strip().lower()
    if not shadow_name:
        primary_name = str(getattr(settings, "AI_ORCHESTRATOR", "crewai")).strip().lower()
        shadow_name = "langgraph" if primary_name == "crewai" else "crewai"

    shadow_settings = _ShadowSettings(
        orchestrator_name=shadow_name,
        ttl_seconds=int(getattr(settings, "GOAL_CREATION_SESSION_TTL_SECONDS", 900)),
    )

    return create_orchestrator(
        settings=shadow_settings,
        pinecone_service=pinecone_service,
        gemini_config=gemini_config,
        session_store=GoalCreationSessionStore(
            redis_client=redis_client,
            default_ttl_seconds=shadow_settings.GOAL_CREATION_SESSION_TTL_SECONDS,
            key_prefix=f"goal_creation_session_shadow_{shadow_name}",
        ),
    )


shadow_runner = ShadowRunner(
    enabled=bool(getattr(settings, "AI_SHADOW_MODE", False)),
    shadow_orchestrator=_resolve_shadow_orchestrator() if bool(getattr(settings, "AI_SHADOW_MODE", False)) else None,
)

@router.on_event("startup")
async def startup_event():
    await pinecone_service.initialize()

@router.post("/questions", response_model=QuestionsResponse)
async def get_strategic_questions(
    http_request: Request,
    request: GoalWizardRequest,
):
    """
    V3 Agentic Workflow - Phase 1: Generate strategic questions.
    
    This endpoint processes the user's initial goal input from the onboarding or goal creation wizard.
    It uses the agentic system to analyze the user's context and generate a set of clarifying,
    strategic questions designed to gather the necessary information for building a hyper-personalized plan.

    - **Request Body (`GoalWizardRequest`):**
      - `user_id`: The ID of the current user.
      - `wizard_data`: A JSON object containing the initial goal details, such as:
        - `goal_description`: "I want to run a 5k in 3 months."
        - `motivation`: "To feel healthier."
        - `availability`: ["mornings", "weekends"]
        - `time_commitment`: "3-4 hours a week"
        - `accountability_type`: "visual_proof"
        - `partner_name`: "Alex" (optional)

    - **Response Body (`QuestionsResponse`):**
      - `session_id`: A unique ID for this goal creation session.
      - `user_profile_summary`: A brief, AI-generated analysis of the user's archetype and risks.
      - `strategic_questions`: A list of 3 question objects, each with:
        - `question`: The question text.
        - `question_key`: A unique key for the question.
        - `context`: Why the question is being asked.
        - `suggested_answers`: A list of 3-4 practical answers.
      - `execution_metadata`: Performance metrics for the agentic workflow.
    """
    try:
        is_internal = _is_internal_request(http_request)
        allow_dev_browser = _allow_dev_browser_goal_creation(http_request)

        if is_internal or allow_dev_browser:
            effective_user_id = request.user_id
            if allow_dev_browser and not is_internal:
                logger.warning(
                    "Using dev browser auth bypass for /goal-creation/questions (user_id=%s)",
                    effective_user_id,
                )
        else:
            raise HTTPException(status_code=401, detail="Not authenticated")

        session_id = str(uuid.uuid4())
        user_context = await pinecone_service.get_user_context(effective_user_id)
        
        questions_result = await duotrak_orchestrator.generate_strategic_questions(
            user_id=effective_user_id,
            session_id=session_id,
            wizard_data=request.wizard_data.dict(),
            user_context=user_context
        )
        shadow_runner.run_questions_shadow(
            session_id=session_id,
            user_id=effective_user_id,
            wizard_data=request.wizard_data.dict(),
            user_context=user_context,
        )
        emit_goal_operation_event(
            "goal_questions_generated",
            session_id=session_id,
            user_id=effective_user_id,
            question_count=len(questions_result.get("questions", [])),
            latency_ms=questions_result.get("execution_time_ms", 0),
        )
        
        return QuestionsResponse(
            session_id=session_id,
            user_profile_summary=questions_result["user_profile_summary"],
            strategic_questions=questions_result["questions"],
            execution_metadata={"question_generation_time_ms": questions_result["execution_time_ms"]}
        )
    except HTTPException:
        raise
    except Exception as e:
        user_for_log = request.user_id if request and request.user_id else "unknown"
        logger.error(f"V3 Question generation failed for user {user_for_log}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate strategic questions.")

@router.post("/{session_id}/plan", response_model=GoalPlanResponse)
async def create_goal_plan(
    http_request: Request,
    session_id: str,
    request: AnswersSubmissionRequest,
):
    """
    V3 Agentic Workflow - Phase 2: Process answers and generate the complete goal plan.
    
    This endpoint takes the user's answers to the strategic questions and uses the agentic
    system to create the final, hyper-personalized goal plan with detailed tasks, milestones,
    and partner accountability integration.

    - **Path Parameter:**
      - `session_id`: The unique ID returned from the `/questions` endpoint.

    - **Request Body (`AnswersSubmissionRequest`):**
      - `user_id`: The ID of the current user.
      - `answers`: A JSON object mapping the `question_key` from Phase 1 to the user's string answer.
        - E.g., `{"past_success_factor": "When my partner Alex checked in daily."}`

    - **Response Body (`GoalPlanResponse`):**
      - `session_id`: The same session ID for tracking.
      - `goal_plan`: The complete, structured goal plan object (`DuotrakGoalPlan`).
      - `partner_integration`: Specific suggestions for partner involvement.
      - `personalization_score`: An AI-generated score of how personalized the plan is.
      - `execution_metadata`: Performance metrics for the agentic workflow.
    """
    try:
        is_internal = _is_internal_request(http_request)
        allow_dev_browser = _allow_dev_browser_goal_creation(http_request)

        if is_internal or allow_dev_browser:
            effective_user_id = request.user_id
            if allow_dev_browser and not is_internal:
                logger.warning(
                    "Using dev browser auth bypass for /goal-creation/%s/plan (user_id=%s)",
                    session_id,
                    effective_user_id,
                )
        else:
            raise HTTPException(status_code=401, detail="Not authenticated")

        plan_result = await duotrak_orchestrator.create_goal_plan_from_answers(
            session_id=session_id,
            user_id=effective_user_id,
            answers=request.answers
        )
        shadow_runner.run_plan_shadow(
            session_id=session_id,
            user_id=effective_user_id,
            answers=request.answers,
        )
        
        # Here you would typically save the generated plan to the database
        # For now, we return it directly.
        
        adapted_result = adapt_goal_plan_response(session_id=session_id, raw_result=plan_result)
        schedule_impact = adapted_result.get("goal_plan", {}).get("schedule_impact", {})
        overload_percent = schedule_impact.get("overload_percent", 0)
        conflict_flags = schedule_impact.get("conflict_flags", []) or []
        fit_band = schedule_impact.get("fit_band", "unknown")

        emit_goal_operation_event(
            "goal_plan_generated",
            session_id=session_id,
            user_id=effective_user_id,
            personalization_score=adapted_result.get("personalization_score", 0),
            latency_ms=adapted_result.get("execution_metadata", {}).get("plan_generation_time_ms", 0),
            overload_percent=overload_percent,
            conflict_count=len(conflict_flags),
            fit_band=fit_band,
        )
        if overload_percent > 0 or len(conflict_flags) > 0:
            emit_goal_operation_event(
                "goal_plan_overload_warning",
                session_id=session_id,
                user_id=effective_user_id,
                overload_percent=overload_percent,
                conflict_count=len(conflict_flags),
                fit_band=fit_band,
            )
        return GoalPlanResponse.model_validate(adapted_result)
    except ValueError as e:
        logger.warning(f"V3 Plan creation value error for session {session_id}: {e}")
        raise HTTPException(
            status_code=404,
            detail={
                "code": "goal_creation_session_not_found",
                "message": str(e),
                "action": "Restart goal creation from /api/v1/goal-creation/questions.",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"V3 Goal plan creation failed for session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create goal plan.")


# ============================================================================
# Onboarding Plan Generation Endpoint (Simplified for Onboarding Flow)
# ============================================================================

ONBOARDING_PLAN_PROMPT = """You are a goal coach helping someone set up their first goal on DuoTrak, a partner accountability app.

Based on the goal template provided, generate a structured plan with 3-5 specific, actionable tasks.

Goal Title: {goal_title}
Goal Description: {goal_description}
{context_section}

Respond with a JSON object containing:
1. "goalType": A single category word (e.g., "mindfulness", "fitness", "learning", "relationship", "financial")
2. "tasks": An array of task objects, each with:
   - "taskName": A clear, actionable task name
   - "description": A 1-2 sentence description of what to do
   - "repeatFrequency": One of "daily", "weekly", or "once"

Make the tasks progressive and achievable. The first task should be very simple to build momentum.
Respond ONLY with the JSON object, no additional text."""


@router.post("/onboarding/plan", response_model=OnboardingPlanResponse)
async def generate_onboarding_plan(
    request: OnboardingPlanRequest,
):
    """
    Generate a personalized onboarding plan from a goal template.
    
    This endpoint is designed for the onboarding flow where users select
    from pre-defined goal templates and optionally provide contextual answers.
    It uses Gemini AI to generate specific, actionable tasks.
    
    **Note:** This endpoint does not require authentication to allow
    users to generate plans during the onboarding process before full account setup.
    """
    try:
        logger.info(f"Generating onboarding plan for goal: {request.goalTitle}")
        
        # Build context section from answers if provided
        context_section = ""
        if request.contextualAnswers:
            context_lines = [f"- {k}: {v}" for k, v in request.contextualAnswers.items()]
            context_section = "Additional Context:\n" + "\n".join(context_lines)
        
        # Format the prompt
        prompt = ONBOARDING_PLAN_PROMPT.format(
            goal_title=request.goalTitle,
            goal_description=request.goalDescription,
            context_section=context_section
        )
        
        # Use Gemini Flash for fast response
        model = gemini_service.get_flash_model(use_zero_thinking_budget=True)
        
        # Invoke the model
        response = await model.ainvoke(prompt)
        
        # Parse the JSON response
        try:
            # Extract content from AIMessage
            response_text = response.content if hasattr(response, 'content') else str(response)
            # Clean up potential markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            plan_data = json.loads(response_text.strip())
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {response_text[:500]}")
            raise HTTPException(
                status_code=500,
                detail="AI generated an invalid response format. Please try again."
            )
        
        # Validate and structure the response
        tasks = [
            OnboardingPlanTask(
                taskName=task.get("taskName", "Unnamed Task"),
                description=task.get("description", ""),
                repeatFrequency=task.get("repeatFrequency", "daily")
            )
            for task in plan_data.get("tasks", [])
        ]
        
        return OnboardingPlanResponse(
            goalType=plan_data.get("goalType", "general"),
            tasks=tasks
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Onboarding plan generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate onboarding plan: {str(e)}"
        )

