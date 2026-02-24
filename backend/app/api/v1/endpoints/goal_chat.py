import asyncio
import json

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app.schemas.goal_chat import (
    GoalChatCreateSessionRequest,
    GoalChatCreateSessionResponse,
    GoalChatFinalizeRequest,
    GoalChatFinalizeResponse,
    GoalChatSummaryPatchRequest,
    GoalChatSummaryResponse,
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


def _sse_event(event_name: str, payload: dict) -> str:
    return f"event: {event_name}\ndata: {json.dumps(payload)}\n\n"


@router.post("/{session_id}/turns/stream")
async def create_goal_chat_turn_stream(session_id: str, request: GoalChatTurnRequest):
    try:
        turn_result = await goal_chat_session_service.apply_turn(
            session_id=session_id,
            message=request.selected_chip or request.message,
            slot_updates=request.slot_updates.model_dump(exclude_none=True),
            profile_answers=request.profile_answers,
        )
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    async def stream():
        assistant_text = turn_result["next_prompt"]
        for chunk in assistant_text.split(" "):
            yield _sse_event("token", {"text": f"{chunk} "})
            await asyncio.sleep(0.01)
        yield _sse_event("chips", {"chips": turn_result.get("quick_reply_chips", [])})
        yield _sse_event(
            "question_state",
            {
                "missing_slots": turn_result["missing_slots"],
                "captured_slots": turn_result["captured_slots"],
                "is_ready_to_finalize": turn_result["is_ready_to_finalize"],
                "profile": turn_result["profile"],
            },
        )
        yield _sse_event("ready_for_summary", {"ready": turn_result["is_ready_to_finalize"]})
        yield _sse_event("done", {"message": "complete"})

    return StreamingResponse(stream(), media_type="text/event-stream")


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


@router.post("/{session_id}/summary", response_model=GoalChatSummaryResponse)
async def get_goal_chat_summary(session_id: str) -> GoalChatSummaryResponse:
    try:
        result = await goal_chat_session_service.get_summary(session_id=session_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return GoalChatSummaryResponse.model_validate(result)


@router.patch("/{session_id}/summary", response_model=GoalChatSummaryResponse)
async def patch_goal_chat_summary(session_id: str, request: GoalChatSummaryPatchRequest) -> GoalChatSummaryResponse:
    try:
        result = await goal_chat_session_service.patch_summary(session_id=session_id, summary_patch=request.summary)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return GoalChatSummaryResponse.model_validate(result)
