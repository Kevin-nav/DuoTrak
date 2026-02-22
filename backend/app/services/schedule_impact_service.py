import re
from typing import Any, Dict, List, Tuple


def _extract_number(text: str) -> int | None:
    match = re.search(r"(\d+)", text)
    if not match:
        return None
    return int(match.group(1))


def parse_time_commitment_minutes_per_week(value: str | None) -> int:
    if not value:
        return 210

    text = value.lower()
    numbers = [int(n) for n in re.findall(r"\d+", text)]
    base = numbers[0] if numbers else 30
    if len(numbers) >= 2:
        base = int((numbers[0] + numbers[1]) / 2)

    if "hour" in text:
        base *= 60

    if "day" in text or "/d" in text:
        return base * 7
    if "week" in text or "/w" in text:
        return base

    # Default to weekly interpretation for unknown formats.
    return base


def _weekly_frequency(cadence: str) -> int:
    text = (cadence or "").lower()
    if "daily" in text:
        return 7
    match = re.search(r"(\d+)\s*x", text) or re.search(r"(\d+)\s*times?", text)
    if match:
        return max(1, int(match.group(1)))
    if "weekly" in text:
        return 1
    return 3


def _minutes_per_session(task: Dict[str, Any]) -> int:
    for field in ("description", "success_metric"):
        value = str(task.get(field, ""))
        num = _extract_number(value)
        if num is not None and ("min" in value.lower() or "minute" in value.lower()):
            return max(5, num)
    return 30


def _availability_token(value: str) -> str:
    text = value.lower()
    if "flex" in text:
        return "flexible"
    if "weekend" in text:
        return "weekend"
    if "morning" in text:
        return "morning"
    if "lunch" in text or "noon" in text:
        return "lunch"
    if "evening" in text or "night" in text:
        return "evening"
    return "other"


def _window_token(value: str) -> str:
    text = value.lower()
    if "weekend" in text:
        return "weekend"
    if "morning" in text:
        return "morning"
    if "lunch" in text or "noon" in text:
        return "lunch"
    if "evening" in text or "night" in text:
        return "evening"
    return "other"


def estimate_projected_load_minutes(goal_plan: Dict[str, Any]) -> int:
    total = 0
    for milestone in goal_plan.get("milestones", []):
        for task in milestone.get("tasks", []):
            frequency = _weekly_frequency(str(task.get("recommended_cadence", "")))
            total += frequency * _minutes_per_session(task)
    return total


def detect_conflict_flags(goal_plan: Dict[str, Any], availability: List[str]) -> List[str]:
    if not availability:
        return []
    availability_tokens = {_availability_token(item) for item in availability}
    if "flexible" in availability_tokens:
        return []

    flags: List[str] = []
    for milestone_index, milestone in enumerate(goal_plan.get("milestones", [])):
        for task_index, task in enumerate(milestone.get("tasks", [])):
            windows = task.get("recommended_time_windows", [])
            if not isinstance(windows, list) or not windows:
                continue
            window_tokens = {_window_token(str(window)) for window in windows}
            if window_tokens.isdisjoint(availability_tokens):
                flags.append(
                    f"Task {milestone_index + 1}.{task_index + 1} time window does not match stated availability."
                )
    return flags


def build_schedule_impact(
    goal_plan: Dict[str, Any],
    *,
    time_commitment: str | None,
    availability: List[str] | None,
) -> Dict[str, Any]:
    capacity = parse_time_commitment_minutes_per_week(time_commitment)
    projected = estimate_projected_load_minutes(goal_plan)
    overload_percent = 0.0
    if capacity > 0 and projected > capacity:
        overload_percent = ((projected - capacity) / capacity) * 100

    conflict_flags = detect_conflict_flags(goal_plan, availability or [])
    fit_band = "good"
    if overload_percent > 10 or conflict_flags:
        fit_band = "overloaded"
    elif overload_percent > 0:
        fit_band = "warning"

    return {
        "capacity_minutes": int(capacity),
        "projected_load_minutes": int(projected),
        "overload_percent": round(overload_percent, 2),
        "conflict_flags": conflict_flags,
        "fit_band": fit_band,
    }


def apply_soft_cap_scaling(
    goal_plan: Dict[str, Any],
    *,
    capacity_minutes: int,
    projected_load_minutes: int,
    soft_cap_percent: float,
) -> Tuple[Dict[str, Any], bool]:
    if capacity_minutes <= 0 or projected_load_minutes <= 0:
        return goal_plan, False

    allowed = capacity_minutes * (1 + (soft_cap_percent / 100))
    if projected_load_minutes <= allowed:
        return goal_plan, False

    ratio = allowed / projected_load_minutes
    scaled = dict(goal_plan)
    scaled_milestones = []
    for milestone in goal_plan.get("milestones", []):
        scaled_milestone = dict(milestone)
        scaled_tasks = []
        for task in milestone.get("tasks", []):
            current = _weekly_frequency(str(task.get("recommended_cadence", "")))
            scaled_frequency = max(1, round(current * ratio))
            updated_task = dict(task)
            updated_task["recommended_cadence"] = f"{scaled_frequency}x per week"
            scaled_tasks.append(updated_task)
        scaled_milestone["tasks"] = scaled_tasks
        scaled_milestones.append(scaled_milestone)
    scaled["milestones"] = scaled_milestones
    return scaled, True
