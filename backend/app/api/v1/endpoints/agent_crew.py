# backend/app/api/v1/endpoints/agent_crew.py
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
import logging
import uuid
from datetime import datetime

from app.schemas.agent_crew import GoalWizardRequest, QuestionsResponse, AnswersSubmissionRequest, GoalPlanResponse
from app.services.duotrak_crew_orchestrator import DuotrakCrewOrchestrator
from app.services.pinecone_service import PineconeService
from app.services.gemini_config import GeminiModelConfig
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize services
gemini_config = GeminiModelConfig()

pinecone_service = PineconeService(
    api_key=settings.PINECONE_API_KEY,
    environment="aws", # Placeholder, adjust as needed
    index_name=settings.PINECONE_INDEX_NAME
)

duotrak_orchestrator = DuotrakCrewOrchestrator(
    pinecone_service=pinecone_service,
    gemini_config=gemini_config
)

@router.on_event("startup")
async def startup_event():
    await pinecone_service.initialize()

@router.post("/wizard/questions", response_model=QuestionsResponse)
async def get_strategic_questions(request: GoalWizardRequest):
    try:
        session_id = str(uuid.uuid4())
        user_context = await pinecone_service.get_user_context(request.user_id)
        
        questions_result = await duotrak_orchestrator.generate_strategic_questions(
            user_id=request.user_id,
            session_id=session_id,
            wizard_data=request.wizard_data.dict(),
            user_context=user_context
        )
        
        return QuestionsResponse(
            session_id=session_id,
            user_profile_summary=questions_result["user_profile_summary"],
            strategic_questions=questions_result["questions"],
            execution_metadata={"question_generation_time_ms": questions_result["execution_time_ms"]}
        )
    except Exception as e:
        logger.error(f"Question generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate strategic questions.")

@router.post("/{session_id}/answers", response_model=GoalPlanResponse)
async def submit_answers_and_create_plan(session_id: str, request: AnswersSubmissionRequest):
    try:
        plan_result = await duotrak_orchestrator.create_goal_plan_from_answers(
            session_id=session_id,
            user_id=request.user_id,
            answers=request.answers
        )
        
        return GoalPlanResponse(
            session_id=session_id,
            goal_plan=plan_result["final_plan"],
            partner_integration=plan_result["partner_integration"],
            personalization_score=plan_result["internal_score"],
            execution_metadata={"plan_generation_time_ms": plan_result["execution_time_ms"]}
        )
    except Exception as e:
        logger.error(f"Goal plan creation failed for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create goal plan.")
