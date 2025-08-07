# Authentication System Debugging Summary

**Date:** August 6, 2025
**Status:** A persistent post-login race condition is preventing the application from being usable. A plan to upgrade the Next.js framework is the proposed next step.

---

## 1. Problem Description

The core issue is a persistent bug that occurs immediately after a user successfully logs in (either via email or Google).

### User-Facing Symptoms:
1.  After the login is submitted and the Firebase popup closes, the user is redirected to the `/dashboard` page.
2.  The dashboard page displays a loading spinner which persists indefinitely.
3.  In some instances, a "failed to fetch" error message appears on the login screen.
4.  The user is never successfully logged into the application, despite the backend logs showing a successful authentication event.

This problem has blocked all further development and testing of authenticated features.

## 2. Chronological Troubleshooting History

What follows is a complete, chronological record of the attempts made to diagnose and fix this issue.

### Initial State: Complex Proxy Architecture

The application began with a complex authentication flow where the frontend client would authenticate with Firebase, then send the resulting ID token to a Next.js API route. This route acted as a proxy, creating a session cookie itself while also calling the FastAPI backend to sync the user's profile. This architecture was prone to race conditions.

### Attempt 1: The Grand Refactor (Architectural Fix)

-   **Hypothesis:** The proxy architecture was too complex and the root cause of the race conditions.
-   **Action:** We initiated a major refactoring with the following goals:
    1.  **Backend:** Implement a robust, atomic login endpoint in FastAPI using JWTs for session and refresh tokens.
    2.  **Frontend:** Remove the Next.js proxy API route and have the client communicate directly with the FastAPI backend.
    3.  **Frontend:** Centralize all redirection logic into the Next.js middleware, removing scattered logic from hooks and components.
    4.  **Frontend:** The login endpoint would now return the full user profile, which would be manually injected into the React Query cache to avoid a second, problematic network request after login.
-   **Outcome:** The new architecture was implemented successfully, and the backend passed a full suite of `pytest` tests, verifying its correctness. However, the user-facing "indefinite spinner" bug persisted.

### Attempt 2: Diagnosing the "Failed to Fetch" Error (CORS)

-   **Evidence:** The browser console showed a clear CORS error: `The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.`
-   **Hypothesis:** The backend's CORS policy was too permissive for credentialed requests.
-   **Action:** We modified the `CORSMiddleware` in `backend/app/main.py` to use a specific list of allowed origins (`["http://localhost:3000", "http://127.0.0.1:3000"]`) instead of the wildcard `*`.
-   **Outcome:** The issue persisted. This was a necessary and correct security fix, but it did not solve the underlying problem, indicating a more subtle issue was at play.

### Attempt 3: The `Secure` Cookie Flag

-   **Evidence:** A user-provided analysis noted that the backend was setting cookies with the `Secure` flag, even in an `http://` development environment.
-   **Hypothesis:** The browser was silently discarding the cookies because they were marked as `Secure` but were being served over an insecure HTTP connection.
-   **Action:** We modified `backend/app/api/v1/endpoints/auth.py` to make the `secure` flag conditional, setting it to `True` only in a production environment.
-   **Outcome:** The issue persisted. While this was a critical and correct bug fix for ensuring development functionality, it was not the root cause of the final indefinite spinner.

### Attempt 4: The Unreliable `document.cookie` Check

-   **Evidence:** Our diagnostic logs showed that the `fetchUser` function in `UserContext.tsx` was returning `null` because a check (`document.cookie.includes(...)`) was failing immediately after login.
-   **Hypothesis:** A known browser behavior was preventing the cross-origin cookie from being available to `document.cookie` immediately after being set. This premature check was short-circuiting the user fetch.
-   **Action:** We removed the unreliable `document.cookie` check from `UserContext.tsx`, forcing it to always attempt the API call to verify the session.
-   **Outcome:** The issue persisted. This proved the cookie was likely not being set at all from the browser's perspective, leading back to the CORS-like symptoms.

## 3. Current Status & Final Hypothesis

-   The backend is **correct**. It passes its tests and logs show it successfully creates sessions.
-   The frontend architecture is **correct**. It uses the atomic login pattern.
-   The "indefinite spinner" is caused by the `UserContext`'s `useQuery` hook silently failing when it tries to fetch the user data right after login.

The only remaining explanation is a subtle, low-level environmental issue between this specific version of Next.js (14.2.16), the browser's security model for cross-origin requests with credentials, and the local development server. We have exhausted all application-level logic and configuration fixes.

## 4. The New Plan: Upgrade Next.js Framework

-   **Rationale:** After eliminating all application-level causes, the problem most likely lies within the framework itself or its interaction with the browser. A major version upgrade (from 14 to 15) includes significant updates to Next.js's underlying server and networking code. It is plausible that these updates will resolve this deep-seated environmental bug. Furthermore, the upgrade brings the project to the latest stable version, providing security patches and new features. Our research confirmed that Next.js 15 introduced major changes to how cookies are handled, making this a highly relevant upgrade.

-   **Action Plan:**
    1.  **Update `package.json`:** Modify the `next` dependency to the latest stable version (e.g., `^15.4.5`).
    2.  **Install Dependencies:** Run `npm install` to update the project's dependencies.
    3.  **Refactor for Async Cookies:** The primary breaking change in Next.js 15 is that the `cookies()` function from `next/headers` is now asynchronous. We must find all instances of its use (primarily in our middleware and API routes) and update the code to use `async/await`.
    4.  **Test:** Thoroughly test the application manually to confirm the fix and ensure no new regressions were introduced.
    5.  **Implement Frontend Tests:** As promised, once the application is stable, immediately proceed to set up a Jest and React Testing Library suite to create a safety net for the new, working authentication flow.
