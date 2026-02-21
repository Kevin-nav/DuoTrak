# AI Orchestrator Rollback Runbook

## Trigger Conditions

- Any cutover abort criteria in `ai-orchestrator-cutover.md` are hit.
- Significant user-facing errors increase after orchestrator switch.

## Rollback Flags

- `AI_ORCHESTRATOR=crewai`
- `AI_SHADOW_MODE=false`
- `AI_DIRECT_PYTHON_FALLBACK=true`

## Rollback Steps

1. Set rollback flags immediately.
2. Redeploy backend service.
3. Confirm legacy route behavior:
   - goal creation questions endpoint healthy
   - goal plan creation endpoint healthy
4. Verify error rates and p95 latencies return to baseline.
5. Record incident details and timestamped metrics.

## Post-Rollback Validation

- `schema_validation_success >= 99%`
- `question_endpoint_p95_seconds < 4`
- `plan_endpoint_p95_seconds < 10`
- `session_not_found_rate < 0.5%`
