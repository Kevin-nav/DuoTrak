# Auth Simplification Design (Firebase + Convex Only)

**Date:** 2026-02-22  
**Status:** Approved

## Goal
Simplify login, signup, route protection, and logout by using Firebase identity + Convex auth as the single source of truth and removing cookie-session auth from the Next.js layer.

## Architecture
- Firebase handles user sign-in/sign-up and sign-out on the client.
- Convex auth state is authoritative for authenticated app access.
- Next.js auth API cookie handlers (`/api/auth/*`) are removed.
- Middleware no longer performs auth checks.
- Protected route behavior is centralized in client guard/layout logic.

## Data Flow
### Login / Signup
1. User signs in via Firebase SDK.
2. Convex provider observes ID token and authenticates queries.
3. UI redirects after successful auth state.
4. Invitation acceptance runs using a single query param key: `token`.

### Protected App Routes
1. App layout renders `RouteGuard`.
2. `RouteGuard` waits for user loading state.
3. If unauthenticated, redirect to `/login`.
4. If authenticated, render protected content.

### Logout
1. Trigger Firebase `signOut`.
2. Clear transient local state as needed.
3. Redirect to `/login`.

## Security
- Remove session-cookie and CSRF auth surface in Next auth routes.
- Remove master-access and mock-auth bypass logic from middleware path.
- Avoid sensitive token/cookie logs.

## Testing Requirements
- Login success reaches protected app content.
- Unauthenticated access to protected layout redirects to `/login`.
- Authenticated user opening `/login` redirects to `/dashboard`.
- Logout always lands on `/login`.
- Invitation token continuity (`token`) works through login/signup.
