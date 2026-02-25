import json
from typing import Any, Dict
from urllib import request

from app.core.config import settings


def build_ledger_payload(
    *,
    goal_id: str | None,
    model: str,
    provider: str,
    cost_usd: float,
    input_tokens: int,
    output_tokens: int,
    latency_ms: float,
    workflow_stage: str,
    success: bool,
    request_id: str | None = None,
    user_id: str | None = None,
    error_type: str | None = None,
) -> Dict[str, Any]:
    return {
        "goal_id": goal_id,
        "user_id": user_id,
        "provider": provider,
        "model": model,
        "cost_usd": cost_usd,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "latency_ms": latency_ms,
        "workflow_stage": workflow_stage,
        "success": success,
        "request_id": request_id,
        "error_type": error_type,
    }


async def record_convex_ledger_event(payload: Dict[str, Any]) -> bool:
    endpoint = getattr(settings, "CONVEX_LEDGER_ENDPOINT", None)
    secret = getattr(settings, "CONVEX_LEDGER_SECRET", None)
    if not endpoint or not secret:
        return False

    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        endpoint,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {secret}",
        },
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=3):
            return True
    except Exception:
        return False

