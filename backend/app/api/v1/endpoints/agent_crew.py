from fastapi import APIRouter, HTTPException, status

router = APIRouter()


def _legacy_route_gone(path: str) -> None:
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail={
            "code": "route_gone",
            "message": f"{path} has been retired.",
            "replacement": "/api/v1/goal-creation",
        },
    )


@router.post("/wizard/questions")
async def legacy_questions_route():
    _legacy_route_gone("/api/v1/agent-crew/wizard/questions")


@router.post("/{session_id}/answers")
async def legacy_answers_route(session_id: str):
    _legacy_route_gone(f"/api/v1/agent-crew/{session_id}/answers")
