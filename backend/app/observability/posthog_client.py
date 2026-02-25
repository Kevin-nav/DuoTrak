import json
from typing import Any, Dict, Optional
from urllib import request

from app.core.config import settings


def capture_posthog_event(
    event_name: str,
    *,
    distinct_id: Optional[str] = None,
    properties: Optional[Dict[str, Any]] = None,
) -> bool:
    api_key = getattr(settings, "POSTHOG_API_KEY", None)
    if not api_key:
        return False

    host = (getattr(settings, "POSTHOG_HOST", None) or "https://us.i.posthog.com").rstrip("/")
    payload = {
        "api_key": api_key,
        "event": event_name,
        "distinct_id": distinct_id or "system",
        "properties": properties or {},
    }

    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        f"{host}/capture/",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=3):
            return True
    except Exception:
        return False

