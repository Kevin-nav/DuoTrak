# Deploy Env Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure frontend Docker builds receive only required build-time public vars from GitHub secrets while backend secrets remain Kubernetes-only.

**Architecture:** Frontend build-time env validation is restricted to public vars used by the Next.js app. CI passes these vars as Docker build args. Backend secrets are injected only at runtime via existing K8s secrets (`duotrak-backend-env`, `duotrak-secrets`, `duotrak-firebase-key`).

**Tech Stack:** Next.js, Docker, GitHub Actions, Kubernetes, FastAPI

---

### Task 1: Frontend Build Contract Cleanup

**Files:**
- Modify: `next.config.mjs`
- Modify: `Dockerfile`

**Step 1: Restrict build validation to frontend public vars**
- Remove server-only validation keys from `envSchema`.
- Add `NEXT_PUBLIC_CONVEX_URL` as required.

**Step 2: Remove mock server env from frontend Docker build**
- Remove mock `FIREBASE_SERVICE_ACCOUNT_JSON_PATH`, `SECRET_KEY`, and `FASTAPI_URL` assignments.
- Add missing frontend build args/env for Convex, PostHog, GA, app URL.

**Step 3: Verify Dockerfile arg/env alignment**
- Ensure every build arg passed by workflow maps to `ARG` and `ENV`.

### Task 2: Deploy Workflow Build Args Cleanup

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Step 1: Keep frontend build args explicit and complete**
- Pass required frontend vars from repo secrets (Firebase set + Convex URL).
- Pass optional frontend vars from secrets where relevant (PostHog, GA, app URL).

**Step 2: Keep backend secret-free at image build**
- Confirm no backend secrets are injected in backend build step.

### Task 3: Env Example Hygiene

**Files:**
- Modify: `.env.example`
- Modify: `backend/.env.example`

**Step 1: Align root `.env.example` with frontend/server usage in this repo**
- Keep frontend-required keys and documented optional keys.
- Remove stale or misleading entries not used by app code.

**Step 2: Align `backend/.env.example` with `backend/app/core/config.py`**
- Keep required backend runtime keys.
- Keep optional keys with defaults where used.
- Remove duplicate/legacy keys not read by backend settings.

### Task 4: Consistency Check and Handoff

**Files:**
- No new files required

**Step 1: Run targeted grep checks**
- Verify all referenced env keys are represented in workflow/examples/K8s guidance.

**Step 2: Deliver exact secret inventories**
- Provide final GitHub repo secrets list for frontend build.
- Provide final K8s backend secret key list for runtime.
