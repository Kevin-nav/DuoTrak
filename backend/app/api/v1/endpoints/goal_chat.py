from fastapi import APIRouter, HTTPException, status

from app.schemas.goal_chat import (
    GoalChatCreateSessionRequest,
    GoalChatCreateSessionResponse,
    GoalChatFinalizeRequest,
    GoalChatFinalizeResponse,
    GoalChatTurnRequest,
    GoalChatTurnResponse,
)
from app.services.goal_chat_session_service import GoalChatSessionService


router = APIRouter()
goal_chat_session_service = GoalChatSessionService()


@router.post("/sessions", response_model=GoalChatCreateSessionResponse)
async def create_goal_chat_session(request: GoalChatCreateSessionRequest) -> GoalChatCreateSessionResponse:
    session = await goal_chat_session_service.create_session(
        user_id=request.user_id,
        behavioral_summary=request.behavioral_summary,
    )
    return GoalChatCreateSessionResponse(
        session_id=session["session_id"],
        missing_slots=goal_chat_session_service.initial_missing_slots(),
        required_slots=goal_chat_session_service.required_slots(),
        profile=session["profile"],
    )


@router.post("/{session_id}/turns", response_model=GoalChatTurnResponse)
async def create_goal_chat_turn(session_id: str, request: GoalChatTurnRequest) -> GoalChatTurnResponse:
    try:
        turn_result = await goal_chat_session_service.apply_turn(
            session_id=session_id,
            message=request.message,
            slot_updates=request.slot_updates.model_dump(exclude_none=True),
            profile_answers=request.profile_answers,
        )
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return GoalChatTurnResponse(session_id=session_id, **turn_result)


@router.post("/{session_id}/finalize", response_model=GoalChatFinalizeResponse)
async def finalize_goal_chat_plan(session_id: str, request: GoalChatFinalizeRequest) -> GoalChatFinalizeResponse:
    try:
        result = await goal_chat_session_service.finalize(session_id=session_id, has_partner=request.has_partner)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if not result["finalized"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "goal_chat_validation_failed", "errors": result["validation_errors"]},
        )
    return GoalChatFinalizeResponse.model_validate(result)
