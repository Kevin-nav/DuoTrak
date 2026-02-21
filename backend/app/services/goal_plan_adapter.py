from typing import Any, Dict, List


def _normalize_partner_integration(value: Any) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        actions = value.get("accountability_actions")
        if isinstance(actions, list) and actions:
            return ", ".join(str(item) for item in actions)
    return "Partner support integrated into the plan."


def _normalize_task(task: Dict[str, Any]) -> Dict[str, str]:
    return {
        "description": str(task.get("description", "")),
        "success_metric": str(task.get("success_metric", task.get("successMetric", ""))),
    }


def _normalize_milestone(milestone: Dict[str, Any]) -> Dict[str, Any]:
    tasks: List[Dict[str, Any]] = milestone.get("tasks", [])
    return {
        "title": str(milestone.get("title", "")),
        "description": str(milestone.get("description", "")),
        "tasks": [_normalize_task(task) for task in tasks if isinstance(task, dict)],
    }


def _normalize_goal_plan(goal_plan: Dict[str, Any], partner_integration: Any) -> Dict[str, Any]:
    partner_accountability = goal_plan.get("partner_accountability") or goal_plan.get("partnerAccountability")
    if not isinstance(partner_accountability, dict):
        partner_accountability = {
            "role": "Supportive accountability partner",
            "check_in_schedule": "weekly",
            "shared_celebrations": "Celebrate each completed milestone",
        }

    milestones = goal_plan.get("milestones", [])
    if not isinstance(milestones, list):
        milestones = []

    success_metrics = goal_plan.get("success_metrics", goal_plan.get("successMetrics", []))
    if not isinstance(success_metrics, list):
        success_metrics = []

    return {
        "title": str(goal_plan.get("title", "Personalized Goal Plan")),
        "description": str(goal_plan.get("description", "")),
        "milestones": [_normalize_milestone(m) for m in milestones if isinstance(m, dict)],
        "success_metrics": [str(metric) for metric in success_metrics],
        "partner_accountability": {
            "role": str(partner_accountability.get("role", "Supportive accountability partner")),
            "check_in_schedule": str(partner_accountability.get("check_in_schedule", partner_accountability.get("checkInSchedule", "weekly"))),
            "shared_celebrations": str(partner_accountability.get("shared_celebrations", partner_accountability.get("sharedCelebrations", _normalize_partner_integration(partner_integration)))),
        },
    }


def adapt_goal_plan_response(session_id: str, raw_result: Dict[str, Any]) -> Dict[str, Any]:
    goal_plan = raw_result.get("goal_plan") or raw_result.get("final_plan") or {}
    partner_integration = raw_result.get("partner_integration", "")
    personalization_score = raw_result.get("personalization_score", raw_result.get("internal_score", 0))
    execution_time_ms = raw_result.get("execution_time_ms")

    if execution_time_ms is None:
        execution_metadata = raw_result.get("execution_metadata", {})
        execution_time_ms = execution_metadata.get("plan_generation_time_ms", 0)

    return {
        "session_id": session_id,
        "goal_plan": _normalize_goal_plan(goal_plan if isinstance(goal_plan, dict) else {}, partner_integration),
        "partner_integration": _normalize_partner_integration(partner_integration),
        "personalization_score": float(personalization_score),
        "execution_metadata": {"plan_generation_time_ms": int(execution_time_ms)},
    }
