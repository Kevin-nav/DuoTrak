# Backend AI-Only + UV + Gemini 3 Flash Design

**Date:** 2026-02-23

## Context
- Frontend architecture has moved core product CRUD to Convex.
- Backend should only serve AI orchestration workloads.
- Current backend Python environment is broken and still uses mixed Google SDK paths.

## Goals
1. Migrate backend dependency management to `uv`.
2. Upgrade CrewAI and Google AI integrations to current stable releases.
3. Standardize Flash model naming to the correct Gemini 3 Flash API model ID.
4. Remove backend endpoints/code/libraries no longer needed in Convex-first architecture.

## Non-Goals
- Rebuilding full authentication/session lifecycle in backend.
- Adding new product CRUD routes.
- Redesigning business logic beyond AI orchestration scope.

## Architecture Decisions
1. API surface:
- Keep only AI endpoints in `backend/app/api/v1/endpoints`: `goal_creation.py`, `chat.py`.
- Remove CRUD-oriented endpoints: `users.py`, `goals.py`, `partner_invitations.py`, `storage.py`.
- Remove legacy compatibility endpoint `agent_crew.py` (user requested hard removal).

2. Gemini + Crew integration:
- Keep CrewAI as orchestrator integration via `crewai.LLM` in `gemini_config.py`.
- Use `gemini-3-flash-preview` as the default/forced Flash model ID.
- Keep LangChain Google integration for chat/embed wrappers where used, upgraded to latest stable.
- Remove legacy `google-generativeai` usage from active backend paths.

3. Dependency management:
- Replace `requirements.txt`-only workflow with `pyproject.toml` + `uv.lock`.
- Recreate environment via `uv` to repair broken venv.

4. Code pruning:
- Remove modules only referenced by removed endpoints when no surviving references remain.
- Keep shared infra/services used by goal creation/chat pipelines.

## Risks and Mitigations
- Risk: Hidden dependency from removed endpoints.
  - Mitigation: run `rg` reference checks and backend tests after removals.
- Risk: SDK/model-name mismatch after upgrades.
  - Mitigation: set explicit model constants, update tests, smoke test endpoint imports.
- Risk: Dependency drift during migration.
  - Mitigation: lock with `uv.lock` and document setup commands.

## Validation
1. Run focused unit/integration tests for orchestrator and goal creation flows.
2. Import and start FastAPI app to catch startup/runtime dependency errors.
3. Verify no route registration for removed CRUD endpoints.
4. Verify Gemini Flash model string resolves to `gemini-3-flash-preview` in config paths.
