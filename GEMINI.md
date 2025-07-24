# Gemini Project Brief: DuoTrak_v1.1

## Project Overview

DuoTrak is a full-stack web application designed as a shared goals and tasks dashboard for partners. It features a Next.js frontend and a Python (FastAPI) backend.

## Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS with shadcn/ui component conventions.
- **UI Components:** Radix UI, Lucide React, Recharts (for charts).
- **Form Management:** React Hook Form with Zod for validation.
- **Backend:** Python (FastAPI) located in the `/backend` directory.
- **Authentication:** Firebase for authentication, coupled with a custom backend session management using HTTP-only cookies.
- **Database:** PostgreSQL (inferred from drivers), with Alembic for migrations.
- **Server State Management (Frontend):** React Query (TanStack Query) for data fetching, caching, and synchronization.

## Key Commands

- **Install Frontend Dependencies:** `npm install`
- **Run Frontend Dev Server:** `npm run dev`
- **Install Backend Dependencies:** `pip install -r backend/requirements.txt`
- **Run Backend Dev Server:** (Assumed) `uvicorn app.main:app --reload --port 8000` in the `backend` directory.

## Architecture & Key Concepts

- **Monorepo Structure:** Frontend and backend code are in the same repository but are separate applications.
- **Authentication Flow:**
    1.  User signs in/up via Firebase on the client.
    2.  Firebase ID token is sent to the backend.
    3.  Backend validates the token, creates a session, and returns an HTTP-only `auth_token` cookie.
    4.  The `middleware.ts` protects routes based on the presence of this cookie.
    5.  The `UserContext.tsx` (now powered by React Query) manages user state globally on the client, fetching detailed user data from the backend's `/api/v1/users/me` endpoint after Firebase auth is confirmed.
- **Component-Based UI:** The project uses a highly organized component structure with a dedicated `src/components/ui` directory for the base design system, following shadcn/ui principles.
- **Routing:** Next.js App Router is used.
    - `(app)`: Main application routes (authenticated).
    - `(auth)`: Authentication-related routes (login, signup, etc.).
    - `api`: Next.js API routes.
- **State Management:** Global user state is managed via `UserContext.tsx`, which now leverages React Query for efficient server-state management.

## Recent Changes & Improvements

- **Removed Unused Directory:** The empty `src/context` folder has been removed for clarity.
- **Environment Variable Validation:** Frontend environment variables are now validated using Zod via `src/lib/env.ts`, making configuration more robust. `src/lib/firebase.ts` now imports these validated variables.
- **API Layer Organization:** The `src/lib/api.ts` file has been refactored. Generic API fetching logic is in `src/lib/api/core.ts`, and feature-specific API calls (e.g., invitations) are now in `src/lib/api/invitations.ts`). The original `src/lib/api.ts` acts as a barrel file for backward compatibility.
- **User Context Refactoring (React Query):** `src/contexts/UserContext.tsx` has been refactored to use `@tanstack/react-query` for managing `userDetails`. This simplifies data fetching, caching, and synchronization. A `QueryClientProvider` has been added in `src/components/providers.tsx` and integrated into `src/app/layout.tsx`.
- **Fixed Partner Invitation Error:** Added `expires_in_days` field to `PartnerInvitationCreate` schema in `backend/app/schemas/partner_invitation.py` to resolve an `AttributeError`.
- **Fixed UserRead Schema Error:** Made `timezone`, `notifications_enabled`, `current_streak`, `longest_streak`, `total_tasks_completed`, and `goals_conquered` fields optional in `backend/app/schemas/user.py` to resolve validation errors when accepting invitations.
- **Fixed Verify and Sync Profile Error:** Ensured all fields are explicitly passed when instantiating `UserRead` in `backend/app/api/v1/endpoints/auth.py` to prevent `500 Internal Server Error` during profile synchronization.
- **Fixed User Badges Loading:** Eagerly loaded `user_badges` in `backend/app/services/partner_invitation_service.py` when refreshing the user object to ensure `UserRead` schema validation passes.
- **Fixed User Profile Sync Refresh:** Explicitly refreshed `timezone`, `notifications_enabled`, `current_streak`, `longest_streak`, `total_tasks_completed`, and `goals_conquered` fields in `backend/app/services/user_service.py` after user creation to ensure they are correctly populated from database defaults.
- **Ensured Full User Object Loading:** Modified `get_user_by_firebase_uid` and `get_user_by_email` in `backend/app/services/user_service.py` to explicitly load all `User` model columns and the `user_badges` relationship, ensuring the `User` object is fully populated before being used by `UserRead`.
- **Explicitly Loaded All User Columns on Refresh:** Modified `accept_invitation` in `backend/app/services/partner_invitation_service.py` to explicitly load all `User` model columns when refreshing the user object, ensuring all attributes are present for `UserRead` instantiation.
- **Added Default Values to User Model:** Added `default` values to `timezone`, `notifications_enabled`, `current_streak`, `longest_streak`, `total_tasks_completed`, and `goals_conquered` fields in `backend/app/db/models/user.py` to ensure Pydantic models have fallback values.
- **Explicitly Set Default Values in UserRead Schema:** Updated `UserRead` schema in `backend/app/schemas/user.py` to use `Field(default=None)` for optional fields and `Field(default_factory=list)` for the `badges` list, ensuring Pydantic uses these defaults if values are not provided.
- **Defensive Attribute Access in UserRead Instantiation:** Added `getattr` with default values when constructing the `UserRead` object in `backend/app/api/v1/endpoints/auth.py` to ensure all fields are present, even if the SQLAlchemy object doesn't have them explicitly loaded.
- **Fixed `setUserDetails` Error:** Replaced the outdated `setUserDetails` function with the `refetchUserDetails` function from React Query in the login (`src/app/(auth)/login/page.tsx`), signup (`src/app/(auth)/signup/page.tsx`), and authentication flow (`src/lib/auth-flow.ts`) files to resolve the "setUserDetails is not a function" error.
- **Redesigned Email Templates:** Updated the HTML email templates in `backend/app/services/email_templates.py` with a more modern, visually appealing, and supportive design that aligns with the project's design principles.
- **Fixed User Profile Update (422 Error):** Modified the `UserUpdate` schema in `backend/app/schemas/user.py` to inherit directly from `BaseModel` and explicitly define all fields as `Optional`, resolving the `422 Unprocessable Entity` error during user profile updates.
- **Fixed Profile Picture URL Length:** Increased the length of the `profile_picture_url` column in `backend/app/db/models/user.py` from `VARCHAR(255)` to `Text()` and applied a new Alembic migration to resolve the `StringDataRightTruncationError` when saving long base64 encoded image URLs.
- **Implemented Firebase Email and Password Updates:** Updated `src/components/account-settings.tsx` to use Firebase Authentication APIs (`updateEmail`, `updatePassword`, `reauthenticateWithCredential`) for email and password changes, ensuring proper re-authentication and error handling. The backend is now only updated for email changes to maintain data consistency.
- **Enhanced Error Handling and User Feedback:** Improved error handling and user feedback mechanisms in `src/components/account-settings.tsx` for timezone and notification settings updates, providing more specific error messages to the user.
- **Error Handling:** Always refer to `errors/error1.txt` for execution errors.
- **Fixed `sync_user_profile` not defined error:** Corrected the call to `sync_user_profile` in `backend/app/api/v1/endpoints/auth.py` to correctly reference it as a method of the `user_service` instance (`user_service.sync_user_profile`). This resolved a `NameError` in the backend.
- **Fixed "Not authenticated. No session cookie found." error:** Addressed a race condition in the frontend authentication flow where the `UserContext` was attempting to fetch user details before the HTTP-only session cookie was reliably set by the browser. The fix involved modifying `src/contexts/UserContext.tsx`, `src/lib/auth-flow.ts`, and the login/signup pages (`src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`) to directly update the user details in the frontend context with the data returned from the backend's `verify-and-sync-profile` endpoint, eliminating the need for an immediate, potentially premature, subsequent API call to `/api/v1/users/me`.

## Directory Structure

- `src/app`: Next.js routes.
    - `(app)`: Main application routes (authenticated).
    - `(auth)`: Authentication-related routes (login, signup, etc.).
    - `api`: Next.js API routes.
- `src/components`: Reusable React components.
    - `src/components/ui`: Base design system components (e.g., buttons, inputs).
    - `src/components/providers.tsx`: Central file for client-side React providers (e.g., React Query).
- `src/contexts`: React context providers (notably `UserContext.tsx`).
- `src/lib`: Core utility functions.
    - `src/lib/api`: Organized API call modules (`core.ts`, `invitations.ts`).
    - `src/lib/env.ts`: Zod schema for environment variable validation.
    - `src/lib/firebase.ts`: Firebase initialization.
- `src/middleware.ts`: Handles route protection.
- `backend/`: Contains the entire Python FastAPI backend.

## Persistent Redirection Issue Analysis & Troubleshooting

**Problem Description:**
Users are experiencing an unnecessary redirection from protected routes (e.g., `/profile`) back to `/dashboard` (via `/login` briefly) even after successfully logging in. The dashboard loads correctly, but navigation to other protected routes triggers this loop.

**Initial Diagnosis & Phase 1 (UserContext `useEffect`):**
*   **Problem:** The `UserContext`'s `useEffect` hook was redirecting to `/login` because `userDetails` was `null` during initial page load/navigation, triggering a race condition.
*   **Attempted Fix:** Modified `src/contexts/UserContext.tsx` to ensure the `useEffect` waited for `isLoading` to be `false` before redirecting.
*   **Outcome:** Did not fully resolve the issue; a deeper problem was present.

**Phase 2 (RouteGuard & Refactoring):**
*   **Problem:** Imperative navigation logic scattered across `UserContext` and pages led to unpredictable behavior.
*   **Attempted Fix:**
    *   Created `src/components/auth/RouteGuard.tsx` to centralize authentication-based route protection.
    *   Removed navigation logic from `src/contexts/UserContext.tsx`.
    *   Applied `RouteGuard` to `src/app/(app)/layout.tsx` to protect all nested routes.
*   **Outcome:** Improved architecture but the redirection persisted, revealing a server-side rendering (SSR) conflict.

**Phase 3 (PartnershipGuard):**
*   **Problem:** Partnership status checks were mixed with core authentication logic.
*   **Attempted Fix:**
    *   Created `src/components/auth/PartnershipGuard.tsx` to separate partnership-specific authorization.
    *   Applied `PartnershipGuard` to `src/app/(app)/dashboard/page.tsx`.
*   **Outcome:** Further improved separation of concerns, but the core redirection issue remained.

**Phase 4 (React Query Optimization & Error Boundary):**
*   **Problem:** General performance and error handling could be improved.
*   **Attempted Fix:**
    *   Optimized React Query configuration in `src/components/providers.tsx` (staleTime, cacheTime, retry logic).
    *   Created `src/components/ErrorBoundary.tsx` and applied it to `src/app/layout.tsx` for global error handling.
    *   Made `persistentLog` in `src/lib/logger.ts` SSR-safe.
*   **Outcome:** General improvements, but the redirection bug was still present.

**Re-analysis 1 (SSR Conflict & `isAuthLoading`):**
*   **Problem:** The `RouteGuard` was running on the server during SSR, where `firebaseUser` was `null`, causing it to prematurely redirect and crash due to browser-only APIs. On the client, a race condition existed where `RouteGuard` acted before Firebase fully initialized.
*   **Attempted Fix:**
    *   Introduced `isAuthLoading` state in `src/contexts/UserContext.tsx` to signal when Firebase's initial auth check was complete.
    *   Modified `RouteGuard` to wait for `isAuthLoading` to be `false` before making redirection decisions.
*   **Outcome:** Prevented SSR crashes and improved client-side loading, but the redirection still occurred.

**Re-analysis 2 (Broken Authentication Chain):**
*   **Problem:** The `handleAuthSuccess` function (responsible for syncing Firebase auth with the backend session and setting the `auth_token` cookie) was not being called consistently or correctly after Firebase login, leading to missing session cookies and `401 Unauthorized` errors from the backend.
*   **Attempted Fix:**
    *   Refactored `src/lib/auth-flow.ts` to simplify `handleAuthSuccess`.
    *   Updated `src/contexts/UserContext.tsx` to add a `useEffect` (`AuthSyncEffect`) that watches `firebaseUser` and calls `handleAuthSuccess` to establish the backend session and populate `userDetails` into the React Query cache.
*   **Outcome:** Ensured backend session establishment, but the redirection persisted.

**Re-analysis 3 (Login/Signup Page Simplification):**
*   **Problem:** Redundant calls to `handleAuthSuccess` and manual redirection logic in `src/app/(auth)/login/page.tsx` and `src/app/(auth)/auth/signup/page.tsx` were creating conflicting state updates and race conditions with the `UserContext`'s `AuthSyncEffect`.
*   **Attempted Fix:**
    *   Simplified `src/app/(auth)/login/page.tsx` and `src/app/(auth)/signup/page.tsx` to only handle Firebase authentication (e.g., `signInWithEmailAndPassword`, `signInWithPopup`).
    *   Removed all calls to `handleAuthSuccess` and manual `router.push` calls from these pages, centralizing session establishment and redirection within `UserContext` and `RouteGuard`.
*   **Outcome:** Streamlined the authentication flow, but the redirection still occurred.

**Re-analysis 4 (Premature `useQuery`):**
*   **Problem:** The `useQuery` for `userDetails` in `src/contexts/UserContext.tsx` was still firing automatically and too early (before the `auth_token` cookie was guaranteed to be attached to its request), resulting in `401 Unauthorized` errors and a momentary `null` `userDetails` state that triggered the `RouteGuard`'s redirect.
*   **Attempted Fix:**
    *   Removed the `queryFn` from the `useQuery` for `userDetails` in `src/contexts/UserContext.tsx` and set `enabled: false`.
    *   This ensures `userDetails` is populated *exclusively* by the `AuthSyncEffect` (which calls `handleAuthSuccess` and then `queryClient.setQueryData`), guaranteeing the session cookie is present when the data is set.
*   **Outcome:** The issue was still reported as persistent.

**Re-analysis 5 (Asynchronous `AuthSyncEffect` Loading):**
*   **Problem:** The `isLoading` state in `UserContext` was not accurately reflecting the asynchronous loading state of the `AuthSyncEffect` (which calls `handleAuthSuccess` to populate `userDetails`). This led to the `RouteGuard` making premature decisions because `isLoading` became `false` before `userDetails` was actually populated in the cache.
*   **Attempted Fix:**
    *   Introduced a new state variable `isSyncingUserDetails` in `src/contexts/UserContext.tsx` to track the loading state of the backend synchronization.
    *   Updated the overall `isLoading` calculation in `UserContext.tsx` to include `isSyncingUserDetails` (`isLoading: isAuthLoading || isSyncingUserDetails`).
*   **Outcome:** The issue is still reported as persistent.

**Re-analysis 6 (Unnecessary `useRedirectIfAuthenticated`):**
*   **Problem:** The `useRedirectIfAuthenticated` hook on the login/signup pages is causing a redirect loop. This hook is designed to redirect authenticated users *away* from auth pages. However, because the `RouteGuard` is also redirecting to `/login` when `userDetails` is `null` (even transiently), these two redirection mechanisms are fighting each other.
*   **Current State:** The `RouteGuard` is correctly showing a spinner when `isAuthLoading` or `isSyncingUserDetails` is true. However, when `isAuthLoading` becomes false (Firebase confirms user) but `userDetails` is still `null` (because `AuthSyncEffect` hasn't finished or failed), the `RouteGuard` redirects to `/login`. At this point, `useRedirectIfAuthenticated` on the `/login` page sees a Firebase user (even if `userDetails` is not yet populated) and tries to redirect to `/dashboard`, creating the loop.
*   **Proposed Solution:** Remove `useRedirectIfAuthenticated` from the login and signup pages. The `RouteGuard` is now the single source of truth for authentication-based redirection. Once `userDetails` is properly populated by the `AuthSyncEffect`, the `RouteGuard` will correctly allow access to protected pages, and the user will naturally navigate away from the login/signup pages. If the user is already logged in and tries to access `/login` directly, the `RouteGuard` will see `userDetails` and redirect them to `/dashboard` (or their intended protected page).

## Directory Structure

- `src/app`: Next.js routes.
    - `(app)`: Main application routes (authenticated).
    - `(auth)`: Authentication-related routes (login, signup, etc.).
    - `api`: Next.js API routes.
- `src/components`: Reusable React components.
    - `src/components/ui`: Base design system components (e.g., buttons, inputs).
    - `src/components/providers.tsx`: Central file for client-side React providers (e.g., React Query).
- `src/contexts`: React context providers (notably `UserContext.tsx`).
- `src/lib`: Core utility functions.
    - `src/lib/api`: Organized API call modules (`core.ts`, `invitations.ts`).
    - `src/lib/env.ts`: Zod schema for environment variable validation.
    - `src/lib/firebase.ts`: Firebase initialization.
- `src/middleware.ts`: Handles route protection.
- `backend/`: Contains the entire Python FastAPI backend.