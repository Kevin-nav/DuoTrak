# AI Orchestrator Cutover Runbook

## Purpose

Promote traffic from legacy CrewAI orchestration to LangGraph with explicit safety gates.

## Required SLO Gates (must pass before cutover)

- `schema_validation_success >= 99%`
- `question_endpoint_p95_seconds < 4`
- `plan_endpoint_p95_seconds < 10`
- `session_not_found_rate < 0.5%`

## Feature Flags

- `AI_ORCHESTRATOR=crewai|langgraph`
- `AI_SHADOW_MODE=true|false`
- `AI_DIRECT_PYTHON_FALLBACK=true|false`

## Cutover Steps

1. Validate readiness with `bash scripts/check-cutover-readiness.sh`.
2. Confirm shadow mode has at least 24h stable metrics and all SLO gates pass.
3. Set `AI_SHADOW_MODE=true` and `AI_ORCHESTRATOR=langgraph`.
4. Keep `AI_DIRECT_PYTHON_FALLBACK=true` for the first rollout window.
5. Deploy backend and verify:
   - questions endpoint p95 remains under 4s
   - plan endpoint p95 remains under 10s
   - schema validation remains at or above 99%
6. After stability window, set `AI_DIRECT_PYTHON_FALLBACK=false`.

## Abort Criteria

- schema validation drops below 99%
- question endpoint p95 rises to 4s or higher for 10+ minutes
- plan endpoint p95 rises to 10s or higher for 10+ minutes
- session-not-found rate reaches 0.5% or higher
