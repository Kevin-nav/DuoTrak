# Auth Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate DuoTrak auth to Firebase + Convex only by removing Next.js cookie-session auth and centralizing protected-route behavior in client guards/layouts.

**Architecture:** Client auth events come from Firebase SDK and Convex auth state, with no Next.js session cookie lifecycle. Middleware is reduced to pass-through behavior. Login, signup, invitation, and logout are unified around a single token parameter contract and a single client-side logout action.

**Tech Stack:** Next.js App Router, React, Firebase Auth, Convex, TypeScript, Jest

---

### Task 1: Remove Cookie-Session Auth API Surface

**Files:**
- Delete: `src/app/api/auth/login/route.ts`
- Delete: `src/app/api/auth/logout/route.ts`
- Delete: `src/app/api/auth/me/route.ts`
- Delete: `src/app/api/auth/verify/route.ts`
- Delete: `src/app/api/auth/verify-session/route.ts`
- Delete: `src/app/api/auth/__tests__/cookie-contract.test.ts`
- Delete: `src/lib/auth.ts`
- Delete: `src/lib/auth/server.ts`

**Step 1: Write failing checks**
- Add/adjust references so no code imports removed auth utilities.

**Step 2: Run targeted search**
- Run: `rg -n "/api/auth/|getSessionCookieName|SESSION_COOKIE_NAME" src`
- Expected: no runtime references to removed cookie-session auth.

**Step 3: Minimal implementation**
- Remove obsolete files and update any import sites.

**Step 4: Verify**
- Run: `npm run test -- src/app/api/auth/__tests__` (or nearest available scope)
- Expected: no stale auth cookie test dependency.

**Step 5: Commit**
- `git add ... && git commit -m "refactor: remove next cookie-session auth surface"`

### Task 2: Simplify Middleware to Non-Auth Pass-Through

**Files:**
- Modify: `src/middleware.ts`

**Step 1: Add failing expectation**
- Confirm middleware no longer performs auth redirects.

**Step 2: Implement**
- Remove master-access, mock-auth, and session-cookie auth logic.
- Keep static/API exclusions and allow requests through.

**Step 3: Verify**
- Run: `npm run lint -- src/middleware.ts`
- Expected: clean middleware with no auth branching.

**Step 4: Commit**
- `git add src/middleware.ts && git commit -m "refactor: remove auth from middleware"`

### Task 3: Refactor Login/Signup to Firebase + Convex-Only

**Files:**
- Modify: `src/components/auth/LoginForm.tsx`
- Modify: `src/app/(auth)/signup/page.tsx`

**Step 1: Write failing checks**
- Remove dependencies on `/api/auth/login`.

**Step 2: Implement**
- After Firebase sign-in/up, do not call Next auth APIs.
- Keep invitation acceptance mutation and standardize query key to `token`.
- Use client router transitions rather than hard reloads.

**Step 3: Verify**
- Run: `rg -n "/api/auth/login|invite_token" src`
- Expected: no matches in auth flow files.

**Step 4: Commit**
- `git add src/components/auth/LoginForm.tsx "src/app/(auth)/signup/page.tsx" && git commit -m "refactor: use firebase-convex login/signup flow"`

### Task 4: Unify Logout and Guard Behavior

**Files:**
- Modify: `src/app/logout/page.tsx`
- Modify: `src/contexts/UserContext.tsx`
- Modify: `src/components/auth/RouteGuard.tsx`
- Modify: `src/app/(auth)/layout.tsx`
- Modify: `src/app/(auth)/login/page.tsx`

**Step 1: Implement logout simplification**
- Logout page uses Firebase signOut only and redirects.
- UserContext `signOut` clears local state and redirects consistently.

**Step 2: Implement guard simplification**
- RouteGuard redirects unauthenticated users to `/login` after loading.
- Auth layout handles redirect to `/dashboard` when authenticated.
- Remove duplicate login page guard if layout already handles it.

**Step 3: Verify**
- Run: `rg -n "api/v1/auth/logout|__session|window.location.href" src/app/logout/page.tsx src/contexts/UserContext.tsx src/components/auth/LoginForm.tsx "src/app/(auth)/signup/page.tsx"`
- Expected: no cookie-auth or legacy logout endpoint use.

**Step 4: Commit**
- `git add ... && git commit -m "refactor: unify client-side auth guards and logout"`

### Task 5: Normalize Invitation Token Contract

**Files:**
- Modify: `src/app/invite/[token]/page.tsx`
- Modify: any auth redirect sites using `invite_token`

**Step 1: Implement**
- Standardize redirects and readers to `token`.

**Step 2: Verify**
- Run: `rg -n "invite_token" src`
- Expected: no remaining usage.

**Step 3: Commit**
- `git add src/app/invite/[token]/page.tsx ... && git commit -m "fix: standardize invitation token query param"`

### Task 6: Run Validation and Document Outcomes

**Files:**
- Modify: `docs/plans/2026-02-22-auth-simplification-design.md` (optional notes)

**Step 1: Run checks**
- Run: `npm run lint`
- Run: `npm run test` (or targeted tests if full suite is too heavy)

**Step 2: Record residual risks**
- Note any remaining FastAPI auth endpoints intentionally left for non-frontend consumers.

**Step 3: Commit**
- `git add ... && git commit -m "test: validate firebase-convex auth simplification"`
