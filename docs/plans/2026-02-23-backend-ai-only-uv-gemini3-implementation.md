# Backend AI-Only + UV + Gemini 3 Flash Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert backend to AI-only endpoints, migrate Python dependency management to uv, upgrade CrewAI/Google integrations, and standardize Gemini 3 Flash naming.

**Architecture:** Shrink API routing to `goal_creation` and `chat` only, remove Convex-owned CRUD endpoint modules, then migrate dependency management to `pyproject.toml` + `uv.lock` and align all active Gemini/CrewAI integration points to current stable SDKs with explicit model IDs.

**Tech Stack:** FastAPI, CrewAI, LangChain Google GenAI, google-genai SDK, SQLAlchemy, uv.

---

### Task 1: Freeze and Validate Current API Surface

**Files:**
- Modify: `backend/app/api/v1/router.py`
- Test: `backend/tests/unit/test_chat_service.py`

**Step 1: Write failing coverage check (routing expectations)**
- Add/adjust API router tests if present to assert removed routes are absent and AI routes remain.

**Step 2: Run test to verify it fails**
- Run: `uv run pytest backend/tests/unit -k router -v`
- Expected: FAIL while old routes still registered.

**Step 3: Implement minimal routing change**
- Keep only `goal_creation` and `chat` router includes.

**Step 4: Run tests to verify pass**
- Run: `uv run pytest backend/tests/unit -k router -v`
- Expected: PASS.

**Step 5: Commit**
- `git add backend/app/api/v1/router.py`
- `git commit -m "refactor: restrict backend API surface to AI endpoints"`

### Task 2: Remove Convex-Owned Endpoint Modules

**Files:**
- Delete: `backend/app/api/v1/endpoints/users.py`
- Delete: `backend/app/api/v1/endpoints/goals.py`
- Delete: `backend/app/api/v1/endpoints/partner_invitations.py`
- Delete: `backend/app/api/v1/endpoints/storage.py`
- Delete: `backend/app/api/v1/endpoints/agent_crew.py`
- Modify: `backend/app/api/v1/endpoints/goal_creation.py`

**Step 1: Write failing import/startup check**
- Run app import/startup test expecting no imports from removed endpoint modules.

**Step 2: Run to verify failure**
- Run: `uv run python -c "from app.main import app; print('ok')"`
- Expected: FAIL until imports are cleaned.

**Step 3: Implement removal and refactor**
- Delete modules and replace any `users` endpoint dependency usage in `goal_creation.py` with internal API-key based identity resolution for AI calls.

**Step 4: Re-run startup/import check**
- Run: `uv run python -c "from app.main import app; print('ok')"`
- Expected: PASS.

**Step 5: Commit**
- `git add backend/app/api/v1/endpoints backend/app/api/v1/router.py`
- `git commit -m "refactor: remove Convex-owned backend endpoint modules"`

### Task 3: Upgrade Gemini and Crew Integrations

**Files:**
- Modify: `backend/app/core/config.py`
- Modify: `backend/app/services/gemini_config.py`
- Modify: `backend/app/services/gemini_service.py`
- Modify: `backend/tests/unit/test_orchestrator_factory.py`

**Step 1: Write/adjust tests for model naming**
- Assert flash model resolves to `gemini-3-flash-preview` in CrewAI model path.

**Step 2: Run tests to verify fail**
- Run: `uv run pytest backend/tests/unit/test_orchestrator_factory.py -v`
- Expected: FAIL before config update.

**Step 3: Implement minimal code updates**
- Set default flash model to `gemini-3-flash-preview`.
- Keep flash-only policy in `gemini_config.py`.
- Ensure LangChain Gemini service uses settings-driven model identifiers.

**Step 4: Re-run tests**
- Run: `uv run pytest backend/tests/unit/test_orchestrator_factory.py -v`
- Expected: PASS.

**Step 5: Commit**
- `git add backend/app/core/config.py backend/app/services/gemini_config.py backend/app/services/gemini_service.py backend/tests/unit/test_orchestrator_factory.py`
- `git commit -m "feat: standardize backend on Gemini 3 Flash preview model id"`

### Task 4: Migrate Dependencies to UV and Prune Unused Libraries

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/uv.lock`
- Modify: `backend/requirements.txt`
- Delete or refactor: `backend/app/services/ai_suggestion_service.py` (if unreferenced)

**Step 1: Build dependency manifest**
- Add runtime dependencies to `pyproject.toml` with upgraded stable versions:
  - `crewai==1.9.3`
  - `google-genai==1.64.0`
  - `langchain-google-genai==4.2.1`

**Step 2: Generate lock and env**
- Run: `uv sync`
- Expected: successful environment creation and lock generation.

**Step 3: Remove no-longer-used packages/modules**
- Remove `google-generativeai` and any endpoint-only dependencies no longer needed after cleanup.

**Step 4: Verify dependency health**
- Run: `uv run python -c "import crewai, google.genai, langchain_google_genai; print('ok')"`
- Expected: PASS.

**Step 5: Commit**
- `git add backend/pyproject.toml backend/uv.lock backend/requirements.txt backend/app/services/ai_suggestion_service.py`
- `git commit -m "build: migrate backend dependencies to uv and prune legacy sdk usage"`

### Task 5: Regression Pass for AI-Only Backend

**Files:**
- Test: `backend/tests/unit/test_orchestrator_factory.py`
- Test: `backend/tests/unit/test_goal_plan_adapter.py`
- Test: `backend/tests/unit/test_goal_creation_session_store.py`
- Test: `backend/tests/unit/test_chat_service.py`
- Test: `backend/tests/integration/test_langgraph_goal_pipeline.py`

**Step 1: Run focused test suite**
- Run: `uv run pytest backend/tests/unit/test_orchestrator_factory.py backend/tests/unit/test_goal_plan_adapter.py backend/tests/unit/test_goal_creation_session_store.py backend/tests/unit/test_chat_service.py backend/tests/integration/test_langgraph_goal_pipeline.py -v`

**Step 2: Fix remaining failures**
- Apply minimal patch-level fixes for import drift and config updates.

**Step 3: Re-run the same suite**
- Expected: PASS.

**Step 4: Startup smoke test**
- Run: `uv run python -c "from app.main import app; print('app_ok')"`
- Expected: `app_ok`.

**Step 5: Commit**
- `git add backend`
- `git commit -m "test: stabilize AI-only backend after uv and sdk upgrades"`
