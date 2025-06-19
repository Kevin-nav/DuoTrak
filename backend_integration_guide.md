# DuoTrak Onboarding: Backend Integration Guide

This document outlines all the necessary API endpoints and backend interactions required by the DuoTrak frontend for the complete user onboarding flow. It is based on an analysis of the Next.js components in the `src` directory.

---

## 1. Authentication & User Creation

### 1.1. Email & Password Registration

- **Frontend Component:** `src/app/(auth)/signup/page.tsx`
- **Frontend Action:** User submits the form inside the `SignupPage` component.
- **Backend Interaction:** `POST /api/v1/auth/signup`
- **Purpose:** Creates a new user in Supabase Auth and a corresponding profile in the public `profiles` table.
- **Expected Request Data (from `handleEmailSubmit`):
  ```json
  {
    "full_name": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Expected Response Data:**
  - **Success (201 Created):** `{ "message": "Signup successful. Please check your email to verify your account." }`
  - **Failure (409 Conflict):** `{ "detail": "User with this email already exists." }`
- **Authentication:** None (Public endpoint).
- **Notes:** The backend is responsible for calling `supabase.auth.sign_up()` and then, upon success, inserting a new row into the `profiles` table using the returned user ID.

### 1.2. Google Sign-Up / Sign-In

- **Frontend Components:** `src/app/(auth)/signup/page.tsx`, `src/app/(auth)/login/page.tsx`
- **Frontend Action:** User clicks the `GoogleSignInButton` component.
- **Backend Interaction:** **Direct Supabase SDK Call (from Frontend)**
- **Purpose:** Initiates the Google OAuth flow managed entirely by the Supabase client-side SDK.
- **SDK Method:** `supabase.auth.signInWithOAuth({ provider: 'google' })`
- **Authentication:** None (Public action).
- **Critical Backend Requirement:** A **PostgreSQL trigger** on the `auth.users` table is required. When a new user is created via OAuth, this trigger must automatically create a corresponding entry in the `public.profiles` table, extracting the `full_name` and `avatar_url` from the `raw_user_meta_data` field.

### 1.3. Email & Password Login

- **Frontend Component:** `src/app/(auth)/login/page.tsx`
- **Frontend Action:** User submits the login form.
- **Backend Interaction:** **Direct Supabase SDK Call (from Frontend)**
- **Purpose:** To authenticate the user and obtain a session JWT.
- **SDK Method:** `supabase.auth.signInWithPassword()`
- **Expected Request Data:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Expected Response:** The Supabase SDK will handle the session and return either a valid session object or an error, which the frontend will use to update its `error` state.
- **Authentication:** None (Public action).

---

## 2. Onboarding Flow & Status

### 2.1. Get User Onboarding Status

- **Frontend Component:** This will be called from a central layout or context provider (`src/app/layout.tsx` or a new `src/providers/AppProvider.tsx`) immediately after the Supabase `onAuthStateChange` event fires with a `SIGNED_IN` event.
- **Backend Interaction:** `GET /api/v1/users/me/status`
- **Purpose:** This is the **most critical endpoint** for routing. It fetches the current user's profile and onboarding status to decide which page to show them.
- **Expected Request Data:** None (User is identified by the JWT sent in the `Authorization` header).
- **Expected Response Data:**
  ```json
  {
    "user_id": "uuid",
    "full_name": "string",
    "email": "string",
    "avatar_url": "string | null",
    "onboarding_complete": "boolean", // Is partner_id set?
    "partner_id": "uuid | null",
    "invitation_status": "pending | accepted | none" // Check if they have an outstanding sent invitation
  }
  ```
- **Authentication:** **Required**.

### 2.2. Partner Invitation

- **Frontend Component:** `src/app/(app)/invite-partner/page.tsx`
- **Frontend Action:** User submits the partner's name and email.
- **Backend Interaction:** `POST /api/v1/invitations/send`
- **Purpose:** Creates an invitation record, associates it with the inviting user, and triggers an invitation email to the partner.
- **Expected Request Data (from `handleSubmit`):
  ```json
  {
    "partner_name": "string",
    "partner_email": "string"
  }
  ```
- **Expected Response Data:**
  - **Success (201 Created):** `{ "message": "Invitation sent successfully." }`
  - **Failure (409 Conflict):** `{ "detail": "An active invitation for this user already exists." }`
- **Authentication:** **Required**.
- **Notes:** The backend must generate a unique `invitation_code`, store it with the inviter's ID, and email it to the partner.

### 2.3. Partner Acceptance

- **Frontend Component:** `src/app/(auth)/invite-acceptance/page.tsx`
- **Frontend Action:** The invited user (now logged in) lands on this page with an `invitation_code` in the URL and confirms.
- **Backend Interaction:** `POST /api/v1/invitations/accept`
- **Purpose:** Validates the code, links the two user profiles as partners, and marks the invitation as 'accepted'.
- **Expected Request Data:**
  ```json
  {
    "invitation_code": "string"
  }
  ```
- **Expected Response Data:**
  - **Success (200 OK):** `{ "message": "Partnership confirmed! Welcome to DuoTrak." }`
  - **Failure (404 Not Found):** `{ "detail": "Invalid or expired invitation code." }`
- **Authentication:** **Required** (The logged-in user is the one accepting the invite).
- **Notes:** This is a critical transaction. The backend must atomically:
  1. Find the invitation by its code.
  2. Validate its `status` is 'pending'.
  3. Get the accepting user's ID from their JWT.
  4. Update the `partner_id` field for both the inviter and the acceptor in the `profiles` table.
  5. Update the invitation `status` to 'accepted'.
