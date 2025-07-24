# DuoTrak Developer Onboarding & Project Context

**Last Updated:** 2025-06-21

**Note:** All command-line instructions provided within this document assume a bash environment.

## 1. Project Vision & High-Level Goal

DuoTrak is a web application designed to help users manage shared goals and tasks by fostering a dedicated partnership. This document focuses on the foundational user authentication system, which serves as the gateway to the application's core features. The primary objective of the work documented here was to build a secure, reliable, and scalable authentication flow.

---

## 2. Guiding Principles & Development Philosophy

This project was built following several key principles that should guide future development:

*   **Systematic, Evidence-Based Debugging:** When faced with complex bugs, we did not guess. We followed a strict methodology. The persistent authentication redirect loop to the dashboard is a prime example. Our initial hypotheses about flawed middleware logic or incorrect cookie paths were disproven by adding exhaustive logging. The logs revealed the backend was setting the cookie correctly, but the browser was never sending it back on subsequent requests to the frontend. This led to the correct hypothesis: a cross-origin issue. The browser, for security reasons, refused to send a cookie set by `localhost:8000` to a page on `localhost:3000`. This evidence-based approach allowed us to pinpoint the true root cause and implement the correct fix—the Next.js proxy rewrite—instead of wasting time on incorrect solutions.
    1.  **Form a Hypothesis:** State a clear, testable theory about the cause of the bug.
    2.  **Gather Evidence:** Implement comprehensive logging (`persistentLog` on the frontend, detailed print statements on the backend) to gather data that can prove or disprove the hypothesis.
    3.  **Isolate the Problem:** Systematically determine which part of the system is failing (e.g., frontend vs. backend, cookie creation vs. cookie transmission).
    4.  **Iterate:** If a hypothesis is wrong, form a new one based on the latest evidence. This approach prevented wasted time and led directly to the root cause.

*   **Respect Browser Security:** The final bug was a classic developer oversight: fighting the browser's Same-Origin Policy. The key takeaway is to **work with the browser's security model, not against it.** The proxy solution is a standard, robust pattern for solving cross-origin issues in local development.

*   **Layered, Iterative Development:** The initial directive was to build a minimal, core authentication feature (Layer 1). This focus prevented scope creep and ensured the foundation was solid before adding complexity. Future features should be built in similar layers.

*   **Configuration as Code:** All critical secrets and environment-specific settings (API keys, database URLs, etc.) are managed in `.env` and `.env.local` files. This is a security best practice and makes the application portable. **No secrets should ever be hardcoded.**

*   **Clean Architecture:** We encountered and resolved circular dependency issues by centralizing schemas (`app/schemas`). This enforces a clean separation of concerns between the API layer, the service layer, and the data layer. Maintain this separation.

*   **Testing Strategy:** Formal unit testing with pytest is intentionally omitted from this project due to current environmental constraints. Testing primarily relies on thorough manual validation and end-to-end integration testing.

---

## 3. Technical Architecture

### Tech Stack

*   **Frontend:** Next.js (React), TypeScript, Tailwind CSS, Framer Motion
*   **Backend:** FastAPI (Python), Pydantic, SQLAlchemy
*   **Database:** Supabase (PostgreSQL)
*   **Authentication:** Firebase (Client SDK for UI, Admin SDK for backend verification)
*   **Infrastructure:** Vercel (Frontend Hosting), Google Cloud Run (Backend Hosting)

### Core Authentication Flow (The Final, Working Model)

1.  **User Action:** User signs in via the Next.js frontend using the Firebase Client SDK.
2.  **Token Generation:** The client receives a short-lived Firebase ID Token.
3.  **Proxy Request:** The frontend makes a `fetch` call to a **relative API path** (e.g., `/api/v1/auth/session-login`).
4.  **Next.js Rewrite:** The `next.config.mjs` rewrite rule intercepts this call and proxies it to the FastAPI backend at `http://localhost:8000`.
5.  **Backend Verification:** The backend receives the ID token, verifies it using the Firebase Admin SDK, and finds or creates the corresponding user in the Supabase database.
6.  **Session Cookie Creation:** The backend generates a secure, HTTP-only session cookie (`auth_token`) and includes it in the response headers.
7.  **Proxy Response:** The response (with the `Set-Cookie` header) travels back through the Next.js server to the browser.
8.  **Cookie Storage:** Because the cookie was effectively issued from the same origin as the frontend (`localhost:3000`), the browser securely stores it.
9.  **Client-Side Redirect:** The frontend code, upon receiving a successful response, performs a `window.location.href` redirect to `/dashboard`.
10. **Middleware Validation:** The Next.js middleware intercepts the request to `/dashboard`, finds the `auth_token` cookie, and grants access.

#### User Profile Synchronization: Firebase to Supabase

This is the critical process that keeps our application database in sync with our identity provider.

1.  **Firebase Login on Frontend:** A user logs in via the Next.js app using the Firebase client library, which returns a temporary Firebase ID Token.
2.  **Backend Sync Endpoint:** The frontend immediately sends this ID Token to the backend API at the `/api/v1/auth/verify-and-sync-profile` endpoint.
3.  **Backend Verification:** The backend uses the Firebase Admin SDK to verify the token's validity, issuer, and expiration.
4.  **Data Extraction & Database Sync:** Upon successful verification, the backend extracts the user's `firebase_uid`, `email`, and `full_name` from the token. It then performs an 'upsert' operation on the Supabase `users` table:
    *   If a user with this `firebase_uid` already exists, their details (like `full_name`) are updated.
    *   If no user exists, a new record is created with their `firebase_uid`, `email`, and other default values.
5.  **Purpose:** This process ensures we have a local, secure, and application-specific copy of every user in our Supabase database, which serves as the foundation for all other DuoTrak features (e.g., partnerships, goals).

---

## 4. API Keys & Secrets Management

**Crucial Security Rule: NEVER commit `.env` or `.env.local` files to Git! These files contain sensitive credentials.**

Secrets are managed differently for local development and production.

### Backend Secrets
*Provided via `backend/.env` locally or as environment variables on Google Cloud Run in production.*

*   **`FIREBASE_SERVICE_ACCOUNT_PATH="./firebase-adminsdk.json"`**: (Local Development Only) Path to your Firebase project's service account key JSON file, used to initialize the Firebase Admin SDK.
*   **`FIREBASE_SERVICE_ACCOUNT_JSON="{...}"`**: (Production on Google Cloud Run) The entire content of your Firebase service account key JSON file, stored as a single, multi-line environment variable. The backend's `app/main.py` directly parses this JSON string from the environment variable in production.
*   **`DATABASE_URL="postgresql+asyncpg://user:password@host/dbname"`**: Connection string for your Supabase PostgreSQL database. Used by SQLAlchemy to connect to the database.
*   **`REDIS_URL="redis://<username>:<password>@<host>:<port>"`**: Used by `slowapi` for API Rate Limiting. This is a critical security measure to prevent abuse by stopping a single user from spamming our API with too many requests in a short time. The backend is configured to use the `REDIS_URL` from the `.env` file (locally) or environment variables (in production, pointing to your Upstash Redis instance). This setup allows rate limiting to work correctly even if the backend is running on multiple servers (as it would on Google Cloud Run), because they all share the same central Redis instance to count requests.
*   **`RESEND_API_KEY="re_..."`**: API key for the Resend email service. Used by the backend to send transactional emails (e.g., partner invitations, welcome emails).
*   **`CLIENT_ORIGIN_URL="http://localhost:3000"`**: The origin URL of the frontend application. Used by the backend's CORS configuration to allow requests from the frontend. This will change to the production domain in the production environment.

### Frontend Public Keys
*Provided via `.env.local` locally or as environment variables on Vercel in production.*

These keys are considered "public" as they are visible in the browser, but they are still managed as environment variables for flexibility.

*   **`NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."`**: Your Firebase web app's API key.
*   **`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"`**: Your Firebase project's auth domain.
*   **`NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"`**: Your Firebase project ID.
*   **`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-bucket.appspot.com"`**: Your Firebase storage bucket.
*   **`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."`**: Firebase Messaging Sender ID.
*   **`NEXT_PUBLIC_FIREBASE_APP_ID="1:..."`**: Your Firebase web app ID.

---

## 5. Partner Invitation Flow

### Overview
The Partner Invitation system allows users to invite others to become their partners in DuoTrak. The flow is as follows:

1. **Invitation Creation**: A user sends an invitation to another user's email address
2. **Email Notification**: The recipient receives an email with an acceptance link
3. **Invitation Acceptance/Rejection**: The recipient can accept or reject the invitation
4. **Partnership Creation**: Upon acceptance, a partnership is created between the users

### Database Schema

#### Partner Invitations Table
```sql
CREATE TABLE partner_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_email VARCHAR(255) NOT NULL,
    invitation_token UUID NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for faster lookups
CREATE INDEX idx_partner_invitations_sender_id ON partner_invitations(sender_id);
CREATE INDEX idx_partner_invitations_receiver_email ON partner_invitations(receiver_email);
CREATE INDEX idx_partner_invitations_token ON partner_invitations(invitation_token);
```

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
    partnership_status TEXT NOT NULL DEFAULT 'none',
    current_partner_id UUID NULL
);
```

---

## 6. Email Notifications

The system sends email notifications for various partner invitation events using Resend. The following templates are available:

1. **Partner Invitation Email**
   - Sent when a user invites another user to be their partner
   - Contains an acceptance link with a secure token
   - Includes the inviter's name and an optional message

2. **Invitation Accepted Email**
   - Sent to the inviter when their invitation is accepted
   - Confirms the partnership
   - Provides a link to the dashboard to start using the app together

### Environment Variables for Email
```bash
# Resend API Key
RESEND_API_KEY=your_resend_api_key

# Email Settings
DEFAULT_FROM_EMAIL=DuoTrak <noreply@duotrak.com>
CLIENT_ORIGIN_URL=https://app.duotrak.com
```

---

## 7. API Endpoints

### Partner Invitation Endpoints

1. **Create Invitation**
   - `POST /api/v1/partner-invitations`
   - Creates a new partner invitation
   - Requires `sender_id` and `receiver_email` in the request body

2. **Get Invitation**
   - `GET /api/v1/partner-invitations/{invitation_id}`
   - Retrieves a partner invitation by ID
   - Requires `invitation_id` in the URL path

3. **Accept Invitation**
   - `POST /api/v1/partner-invitations/{invitation_id}/accept`
   - Accepts a partner invitation
   - Requires `invitation_id` in the URL path

4. **Reject Invitation**
   - `POST /api/v1/partner-invitations/{invitation_id}/reject`
   - Rejects a partner invitation
   - Requires `invitation_id` in the URL path

5. **Revoke Invitation**
   - `POST /api/v1/partner-invitations/{invitation_id}/revoke`
   - Revokes a partner invitation
   - Requires `invitation_id` in the URL path

---

## 8. Local Development Setup

Follow these steps precisely to get the project running locally.

### Prerequisites

*   Node.js (v18+)
*   Python (v3.10+)
*   A Firebase project with Email/Password and Google Sign-In providers enabled.
*   A Supabase project with a PostgreSQL database.

### 6.1. Backend Setup

1.  Navigate to the `backend/` directory.
2.  Create and activate a Python virtual environment: `python -m venv .venv` and `source .venv/bin/activate` (or equivalent for your OS).
3.  Install dependencies: `pip install -r requirements.txt`.
4.  **Crucial:** Download your Firebase project's service account key. Rename it to `firebase-adminsdk.json` and place it in the root of the `backend/` directory.
5.  Create a `.env` file in the `backend/` directory and populate it with the following. (*Note: `FIREBASE_PROJECT_ID` is not needed here as the Admin SDK reads it from the service account JSON.*):
    ```
    DATABASE_URL="postgresql+asyncpg://user:password@host/dbname"
    FIREBASE_SERVICE_ACCOUNT_PATH="./firebase-adminsdk.json"
    CLIENT_ORIGIN_URL="http://localhost:3000"
    REDIS_URL="redis://localhost:6379" # Or your Upstash development URL
    RESEND_API_KEY="re_your_dev_resend_api_key"
    ```

### 6.2. Frontend Setup

1.  Navigate to the root project directory.
2.  Install dependencies: `npm install`.
3.  **Crucial Step: Configure Cross-Origin-Opener-Policy in `next.config.mjs`**
    This configuration is vital for Google Sign-In popups to function correctly. Ensure your `next.config.mjs` file explicitly sets security headers to include `Cross-Origin-Opener-Policy: same-origin-allow-popups` for all routes. After modifying `next.config.mjs`, you must delete the `.next` folder (`rm -rf .next` or `rd /s /q .next` on Windows) and then restart the Next.js development server (`npm run dev`) for the changes to take effect.
4.  Create a `.env.local` file in the root directory and populate it with your **frontend** Firebase web app configuration:
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY="..."
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
    NEXT_PUBLIC_FIREBASE_APP_ID="..."
    ```

### 6.3. Database Setup

1.  Connect to your Supabase project's SQL Editor.
2.  Execute the following SQL to create the `users` table:
    ```sql
    CREATE TABLE users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
        partnership_status TEXT NOT NULL DEFAULT 'none',
        current_partner_id UUID NULL
    );
    ```

### 6.4. Running the Application

1.  **Run the Backend:** From the `backend/` directory (with virtual environment active), run: `python -m uvicorn app.main:app --reload --host 0.0.0.0`
2.  **Run the Frontend:** From the project root directory, run: `npm run dev`
3.  Open your browser to `http://localhost:3000`.

---

## 7. Frontend Architecture & Development Journey

While much of the complex debugging centered on the backend and cross-origin communication, the frontend was built with a clear vision of being modern, interactive, and maintainable.

### Tech Stack & Philosophy

*   **Framework:** **Next.js 14+** with the **App Router** was chosen for its powerful blend of Server-Side Rendering (SSR), Static Site Generation (SSG), and an intuitive file-based routing system.
*   **Language:** **TypeScript** is used across the entire frontend codebase to enforce type safety, which drastically reduces runtime errors and improves code clarity.
*   **Styling:** **Tailwind CSS** is our utility-first CSS framework. It enables rapid development of custom designs directly within the component's JSX, keeping styling co-located with logic.
*   **Animation:** **Framer Motion** is integrated for creating smooth, declarative animations. This was a key choice to fulfill the user's request for a "mesmerizing" and visually engaging user experience.

### Key Directories & Files

*   `app/`: The core of the application, containing all routes.
    *   `layout.tsx`: The root layout applied to all pages.
    *   `page.tsx`: The main landing page component.
    *   `(auth)/`: A route group for authentication pages (`/login`, `/signup`) that keeps them organized without affecting the URL path.
    *   `dashboard/`: The protected route for the main application, accessible only after login.
*   `components/`: A library of all reusable React components, such as `HeroSection`, `FeaturesSection`, and custom UI elements like buttons and cards.
*   `lib/`: Contains shared utility functions and client-side library initializations.
    *   `firebase.ts`: Initializes the Firebase client SDK for the frontend.
    *   `logger.ts`: A custom persistent logger using `sessionStorage` that was built during debugging to track state across page reloads.
*   `middleware.ts`: A crucial file at the project root that intercepts requests. It's responsible for checking for the `auth_token` cookie and protecting routes by redirecting unauthenticated users.
*   `next.config.mjs`: The Next.js configuration file. This was modified to include both the **proxy rewrite rule** (vital for solving the cookie issue) and the **COOP security headers** (vital for Google Sign-In popups).

### Development Narrative: From Visuals to a Working Auth Flow

The frontend was built in distinct phases:

1.  **Landing Page Visuals:** The initial focus was on creating a visually stunning landing page. The `HeroSection` was built with an animated headline to immediately capture user attention. The `FeaturesSection` followed, using Framer Motion to create interactive cards that animate on hover.

2.  **The Spotlight Card Challenge:** In an effort to add advanced visuals, we attempted to integrate the `SpotlightCard` from the `react-bits` library. This integration proved buggy and caused conflicts. To maintain momentum, the decision was made to **build a custom, simplified version** of the Spotlight Card. This custom component should be considered a functional placeholder, ready for future refinement or replacement. **We have intentionally abandoned the buggy external module.**

3.  **Implementing Authentication UI:** The `/login` and `/signup` pages were created, providing the user interface for both email/password and Google Sign-In methods. These components use the Firebase client SDK initialized in `lib/firebase.ts` to handle the authentication process.

4.  **Solving the Frontend Redirect:** A significant amount of effort went into ensuring a smooth user experience after login. Initial attempts using the Next.js `router` were unreliable due to browser security policies. The final, robust solution was to use a full page navigation via `window.location.href`, which ensures the browser properly handles the newly set session cookie before navigating to the protected dashboard.

This comprehensive approach, from visual design to deep debugging, has resulted in a frontend that is not only visually appealing but also architecturally sound and ready for future feature development.
