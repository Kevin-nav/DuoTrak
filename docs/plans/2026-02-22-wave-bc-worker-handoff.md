# Wave B/C Worker Handoff (Coordinator Unblock)

Date: 2026-02-22  
Coordinator Branch: `main`

## Why Blocked

Wave B is blocked because Task 4 artifacts are missing from git history/workspace:
- `backend/app/ai/langgraph_goal_pipeline.py`
- `backend/app/ai/orchestrator_factory.py`
- `backend/tests/unit/test_orchestrator_factory.py`
- `backend/tests/integration/test_langgraph_goal_pipeline.py`

Wave C cannot run until Wave B passes.

## Required Worker Deliverables

### Task 4 (Wave B) Worker Commit

Implement and commit:
- `backend/app/ai/langgraph_goal_pipeline.py`
- `backend/app/ai/orchestrator_factory.py`
- `backend/app/core/config.py` (flag wiring if needed)
- `backend/app/api/v1/endpoints/goal_creation.py` (factory usage if needed)
- `backend/tests/unit/test_orchestrator_factory.py`
- `backend/tests/integration/test_langgraph_goal_pipeline.py`

Required test command (must pass in worker evidence):
- `pytest backend/tests/unit/test_orchestrator_factory.py backend/tests/integration/test_langgraph_goal_pipeline.py -v`

### Task 5 (Wave C) Worker Commit

Implement and commit:
- `backend/app/ai/shadow_runner.py`
- `backend/app/api/v1/endpoints/goal_creation.py`
- `deploy/otel-collector-config.yaml`
- `backend/tests/integration/test_shadow_mode_non_blocking.py`

Required test command (must pass in worker evidence):
- `pytest backend/tests/integration/test_shadow_mode_non_blocking.py -v`

## Coordinator Resume Procedure (after SHAs are provided)

1. Cherry-pick T4 SHA.
2. Run Wave B gates in order:
   - T2: `pytest backend/tests/api/v1/test_goal_creation_contract.py -v`
   - T4: `pytest backend/tests/unit/test_orchestrator_factory.py backend/tests/integration/test_langgraph_goal_pipeline.py -v`
   - T7: `npm test -- src/components/__tests__/goal-creation-wizard.test.tsx --runInBand`
   - T9: `pytest backend/tests/api/v1/test_route_surface.py -v`
3. If Wave B passes, cherry-pick T5 SHA.
4. Run Wave C gates:
   - T5: `pytest backend/tests/integration/test_shadow_mode_non_blocking.py -v`
   - T10: `bash scripts/check-cutover-readiness.sh` (or platform equivalent)
5. Stop on first failure and report exact file/test.

