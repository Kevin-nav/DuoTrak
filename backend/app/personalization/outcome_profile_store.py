from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List


OUTCOME_INTERACTION_TYPES = {
    "task_completion",
    "task_skip",
    "streak_break",
    "check_in",
    "task_reschedule",
}


def _parse_timestamp(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(float(value), tz=timezone.utc)
    if isinstance(value, str):
        text = value.strip()
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        try:
            dt = datetime.fromisoformat(text)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    return None


class OutcomeProfileStore:
    """
    Builds a compact outcome-only profile for planning:
    completions, skips, streak breaks, check-in timing, and reschedules.
    """

    def __init__(self, pinecone_service: Any):
        self._pinecone = pinecone_service

    async def get_recent_outcomes(self, user_id: str, *, days: int = 90, limit: int = 200) -> List[Dict[str, Any]]:
        if not getattr(self._pinecone, "index", None):
            return []

        # A static query vector is acceptable here because we rely on metadata filtering.
        query_vector = self._pinecone._generate_embedding(f"outcome_profile_{user_id}")
        query_response = await self._pinecone._query_index(
            vector=query_vector,
            filter={"user_id": user_id},
            top_k=limit,
            include_metadata=True,
        )

        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        records: List[Dict[str, Any]] = []
        for match in getattr(query_response, "matches", []) or []:
            metadata = getattr(match, "metadata", None) or {}
            if metadata.get("interaction_type") not in OUTCOME_INTERACTION_TYPES:
                continue
            ts = _parse_timestamp(metadata.get("timestamp"))
            if ts is None or ts < cutoff:
                continue
            records.append(metadata)
        return records

    def summarize(self, records: List[Dict[str, Any]], *, days: int = 90) -> Dict[str, Any]:
        completion_count = 0
        skip_count = 0
        streak_break_count = 0
        reschedule_count = 0
        check_in_hours: List[int] = []

        for record in records:
            interaction_type = str(record.get("interaction_type", ""))
            if interaction_type == "task_completion":
                completion_count += 1
            elif interaction_type == "task_skip":
                skip_count += 1
            elif interaction_type == "streak_break":
                streak_break_count += 1
            elif interaction_type == "task_reschedule":
                reschedule_count += 1
            elif interaction_type == "check_in":
                ts = _parse_timestamp(record.get("timestamp"))
                if ts:
                    check_in_hours.append(ts.hour)

        total_actions = completion_count + skip_count + reschedule_count
        completion_rate = (completion_count / total_actions) if total_actions > 0 else 0.0
        average_check_in_hour = round(sum(check_in_hours) / len(check_in_hours), 2) if check_in_hours else None

        return {
            "window_days": days,
            "signals": "outcome_only",
            "completion_count": completion_count,
            "skip_count": skip_count,
            "streak_break_count": streak_break_count,
            "reschedule_count": reschedule_count,
            "completion_rate": round(completion_rate, 4),
            "average_check_in_hour": average_check_in_hour,
            "sample_size": len(records),
        }

    async def build_profile(self, user_id: str, *, days: int = 90, limit: int = 200) -> Dict[str, Any]:
        records = await self.get_recent_outcomes(user_id, days=days, limit=limit)
        summary = self.summarize(records, days=days)
        return {"user_id": user_id, "outcome_profile": summary}
