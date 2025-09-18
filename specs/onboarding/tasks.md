# Phase 2: Task Plan

This document breaks down the implementation of the enhanced onboarding feature into actionable developer tasks.

**Story Point (SP) Estimates:** 1 (XS), 2 (S), 3 (M), 5 (L), 8 (XL)

## 1. Backend Tasks (FastAPI)

### Epic: Database

| Task | Description | SP | Dependencies |
|---|---|---|---|
| **DB-1** | Create Alembic migration for `users` and `invitations` tables. | 2 | `data-model.md` |

### Epic: API Endpoints

| Task | Description | SP | Dependencies |
|---|---|---|---|
| **API-1** | Implement `POST /api/v1/invitations` endpoint logic. | 3 | `DB-1` |
| **API-2** | Implement an email service for sending invitations. | 3 | - |
| **API-3** | Integrate email service with the invitations endpoint. | 2 | `API-1`, `API-2` |
| **API-4** | Implement `PUT /api/v1/users/me/complete-onboarding` endpoint. | 2 | `DB-1` |

## 2. Frontend Tasks (Next.js)

### Epic: Theming & UI

| Task | Description | SP | Dependencies |
|---|---|---|---|
| **TH-1** | Locate `mascot.md` and extract the official color palette. | 1 | - |
| **TH-2** | Update `tailwind.config.ts` with new light and dark themes. | 2 | `TH-1` |
| **TH-3** | Build a simple `Stepper` component for the onboarding flow. | 2 | `TH-2` |

### Epic: Onboarding Flow & Components

| Task | Description | SP | Dependencies |
|---|---|---|---|
| **FE-1** | Create the main onboarding flow container at `/onboarding/page.tsx`. | 3 | `TH-3` |
| **FE-2** | Build the `ProfileStep` component with its form and validation. | 3 | `FE-1` |
| **FE-3** | Build the `InvitationStep` component and integrate the API call. | 3 | `FE-1`, `API-1` |
| **FE-4** | Build the `FeatureTourStep` component (using `react-joyride` or similar). | 3 | `FE-1` |
| **FE-5** | Build the `CompletionStep` component. | 1 | `FE-1` |

### Epic: Routing & State Management

| Task | Description | SP | Dependencies |
|---|---|---|---|
| **FE-6** | Update `middleware.ts` to redirect users based on `account_status`. | 2 | `API-4` |
| **FE-7** | Create React Query mutations and queries for all new endpoints. | 2 | `API-1`, `API-4` |

## 3. Testing Tasks

### Epic: Backend Testing

| Task | Description | SP | Dependencies |
|---|---|---|---|
| **BE-T1** | Write unit and integration tests for the new API endpoints. | 5 | `API-1`, `API-4` |

### Epic: Frontend Testing

| Task | Description | SP | Dependencies |
|---|---|---|---|
| **FE-T1** | Write unit tests for all new onboarding components. | 5 | `FE-2`, `FE-3`, `FE-4` |
| **FE-T2** | Write an end-to-end test for the complete onboarding flow. | 5 | All FE tasks |
