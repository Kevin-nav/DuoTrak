"""AI Plan Generator — takes chat-collected slots + conversation history and
generates a rich structured plan with milestones, tasks, schedules, and
progress weights for the progress bar."""

import json as _json
import logging
from typing import Any, Dict, List

from app.core.config import settings

logger = logging.getLogger(__name__)

PLAN_GENERATION_PROMPT = """\
You are DuoTrak's goal planner AI. You receive conversation context from a goal-setting chat and must produce a DETAILED, ACTIONABLE goal plan.

DuoTrak is a partner accountability platform — users are accountable to a REAL person.

ACCOUNTABILITY TYPES:
- "photo": partner sees photo proof (gym, cooking, art)
- "video": partner watches video (music, dance, workouts)
- "voice": voice note reflecting on learning (reading, studying)
- "check_in": check in within a time window (wake up, medication)
- "task_completion": mark done, partner reviews (project milestones)

CONVERSATION HISTORY:
{history}

COLLECTED INFO:
{slots}

INSTRUCTIONS:
1. Create a structured goal plan with 3-5 milestones that build progressively.
2. Each milestone has tasks with specific schedule and frequency.
3. progress_weight across all milestones MUST sum to exactly 100.
4. Use the conversation context for schedule (e.g. "weekends" → days: ["saturday", "sunday"]).
5. Each task inherits the goal's accountability_type unless a different one makes more sense.
6. Be specific and practical — not generic.
7. target_week is relative to the goal start date.

Return ONLY valid JSON matching this structure:
{{
  "title": "Goal title",
  "description": "2-3 sentence goal description",
  "intent": "habit|milestone|target-date",
  "accountability_type": "photo|video|voice|check_in|task_completion",
  "deadline": "human readable or null",
  "milestones": [
    {{
      "name": "Milestone name",
      "description": "What this milestone achieves",
      "target_week": 8,
      "progress_weight": 25,
      "tasks": [
        {{
          "name": "Task name",
          "description": "What to do",
          "frequency": "daily|weekly|biweekly|monthly",
          "days": ["monday", "wednesday"],
          "duration_minutes": 30,
          "accountability_type": "video"
        }}
      ]
    }}
  ]
}}
"""


async def generate_plan(
    slots: Dict[str, Any],
    conversation_history: List[Dict[str, str]],
) -> Dict[str, Any]:
    """Call Gemini (smart model) to generate a rich goal plan."""
    history_text = ""
    if conversation_history:
        lines = []
        for entry in conversation_history:
            role = entry.get("role", "user")
            lines.append(f"  {role}: {entry.get('message', '')}")
        history_text = "\n".join(lines)

    prompt = PLAN_GENERATION_PROMPT.format(
        history=history_text or "(no history)",
        slots=_json.dumps(slots, indent=2),
    )

    try:
        from google import genai

        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        smart_model = settings.FLASH_MODEL or "gemini-3-flash-preview"

        response = await client.aio.models.generate_content(
            model=smart_model,
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                temperature=0.4,
                top_p=0.9,
                response_mime_type="application/json",
            ),
        )
        raw = response.text.strip().replace("```json", "").replace("```", "").strip()
        plan = _json.loads(raw)

        # Validate progress_weight sums to 100
        milestones = plan.get("milestones", [])
        total_weight = sum(m.get("progress_weight", 0) for m in milestones)
        if total_weight != 100 and milestones:
            # Normalize weights to sum to 100
            for m in milestones:
                m["progress_weight"] = round(m.get("progress_weight", 0) * 100 / total_weight)
            # Fix rounding errors
            diff = 100 - sum(m["progress_weight"] for m in milestones)
            if diff != 0:
                milestones[-1]["progress_weight"] += diff

        logger.info("Plan generated: %d milestones, weights sum=%d",
                     len(milestones),
                     sum(m.get("progress_weight", 0) for m in milestones))
        return plan

    except Exception as exc:
        logger.exception("Plan generation failed: %s", exc)
        # Fallback: return a basic plan from the slots
        return _fallback_plan(slots)


def _fallback_plan(slots: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a minimal plan if AI call fails."""
    tasks_raw = slots.get("tasks", [])
    tasks = []
    for t in (tasks_raw if isinstance(tasks_raw, list) else []):
        name = t.get("name", "Task") if isinstance(t, dict) else str(t)
        tasks.append({
            "name": name,
            "description": "",
            "frequency": "weekly",
            "days": [],
            "duration_minutes": 30,
            "accountability_type": slots.get("accountability_type", "task_completion"),
        })

    return {
        "title": slots.get("success_definition", "My Goal"),
        "description": slots.get("success_definition", ""),
        "intent": slots.get("intent", "habit"),
        "accountability_type": slots.get("accountability_type", "task_completion"),
        "deadline": slots.get("deadline"),
        "milestones": [
            {
                "name": "Complete Goal",
                "description": slots.get("success_definition", "Achieve the goal"),
                "target_week": 12,
                "progress_weight": 100,
                "tasks": tasks,
            }
        ],
    }
