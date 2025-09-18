# Phase 1: Quickstart Guide

This guide provides developers with a high-level overview of the tasks required to implement the enhanced onboarding feature.

## 1. Backend Implementation (FastAPI)

### 1.1. Database Migrations
- **Tool**: Alembic
- **Action**: Create a new migration script.
  - Add the `account_status` column to the `users` table (default: `'AWAITING_ONBOARDING'`).
  - Create the new `invitations` table as specified in `data-model.md`.
- **Command**: `alembic revision -m "add_onboarding_and_invitations_models"`
- **Verification**: Run `alembic upgrade head` and inspect the database schema.

### 1.2. API Endpoint Implementation
- **Location**: `backend/app/api/v1/`
- **Task 1: Invitation Endpoint**
  - Create a new file `endpoints/invitations.py`.
  - Implement the `POST /api/v1/invitations` endpoint.
  - Logic should handle email validation, token generation, and saving the invitation record.
  - It must also include logic to send the actual email (e.g., using a service like SendGrid or a simple SMTP library).
- **Task 2: Onboarding Completion Endpoint**
  - In `endpoints/users.py`, add the `PUT /api/v1/users/me/complete-onboarding` endpoint.
  - The logic should verify the user's current status and update it to `ACTIVE`.

## 2. Frontend Implementation (Next.js)

### 2.1. Theming
- **File**: `tailwind.config.ts`
- **Action**: Update the configuration with the new mascot-based color palette.
  - Define CSS variables for both light and dark themes.
  - Ensure the new theme is applied globally in `src/app/layout.tsx`.

### 2.2. Onboarding Flow Component
- **Location**: `src/app/(app)/onboarding/page.tsx`
- **Action**: Create the main component to manage the multi-step flow.
  - Use React state (`useState`) to track the current step.
  - Conditionally render the component for each step.

### 2.3. Step Components
- **Location**: `src/components/onboarding/`
- **Task 1: Profile Setup (`ProfileStep.tsx`)**
  - Build the form with `shadcn/ui` components (`Input`, `Avatar`, `Button`).
  - Use `react-hook-form` and a Zod schema for validation.
- **Task 2: Partner Invitation (`InvitationStep.tsx`)**
  - Build the invitation form.
  - Use React Query's `useMutation` hook to call the `POST /api/v1/invitations` endpoint.
- **Task 3: Feature Tour (`FeatureTourStep.tsx`)**
  - Implement the tour using the chosen library (e.g., `react-joyride`) or custom components.

### 2.4. Routing and State
- **Middleware**: Update `src/middleware.ts` to redirect users with `account_status === 'AWAITING_ONBOARDING'` to the `/onboarding` page.
- **API Calls**: Use React Query for all API interactions to handle caching, loading, and error states.

## 3. Testing

- Write unit tests for all new components.
- Write integration tests for the full onboarding flow.
- On the backend, add tests for the new API endpoints and services.
