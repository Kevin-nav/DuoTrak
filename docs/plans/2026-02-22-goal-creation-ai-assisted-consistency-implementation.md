# Goal Creation AI-Assisted Consistency Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a richer AI-assisted goal creation experience that optimizes for consistency, flexible partner accountability, and advisory proof guidance.

**Architecture:** Extend the shared goal creation contract and backend schema so AI output includes cadence/timing/proof guidance fields per task. Normalize output in the adapter layer, then render the richer data in the goal creation wizard with minimal additional user input.

**Tech Stack:** Next.js, React, Convex actions, FastAPI, Pydantic, Zod

---

### Task 1: Extend Shared Contracts

**Files:**
- Modify: `packages/contracts/src/goalCreation.ts`
- Modify: `packages/contracts/src/goalPlan.ts`
- Modify: `src/schemas/goal.ts`

**Outcome:**
- Wizard request includes deadline/check-in style.
- Task schema includes cadence/time/rationale/partner/proof guidance fields.
- Frontend schema file re-exports goal creation contract symbols cleanly.

### Task 2: Extend Backend Schemas and Plan Normalization

**Files:**
- Modify: `backend/app/schemas/agent_crew.py`
- Modify: `backend/app/services/goal_plan_adapter.py`

**Outcome:**
- Backend accepts new wizard inputs.
- Task output model supports new guidance fields.
- Adapter guarantees normalized fallbacks for new fields.

### Task 3: Update Orchestrator Instructions and Fallback Output

**Files:**
- Modify: `backend/app/services/duotrak_crew_orchestrator.py`

**Outcome:**
- Prompt instructs consistency-first planning, flexible daily partner support, and advisory photo-proof guidance.
- Fallback plan returns schema-compatible milestone/task fields.

### Task 4: Update Convex Action and Wizard UX

**Files:**
- Modify: `convex/onboarding.ts`
- Modify: `src/components/goal-creation-wizard.tsx`

**Outcome:**
- Convex action accepts new wizard payload fields.
- Wizard collects deadline/check-in style.
- Plan generation stage messaging is clearer.
- Review screen shows cadence, rationale, partner touchpoints, and proof guidance.
- Goal save uses AI cadence/time defaults when available.

### Task 5: Validate with Targeted Test

**Files:**
- Validate: `src/components/__tests__/goal-creation-wizard.test.tsx`

**Outcome:**
- Existing wizard action boundary test passes after schema and UI updates.
