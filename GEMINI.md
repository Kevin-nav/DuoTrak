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
- **Run Backend Dev Server:** `uvicorn app.main:app --reload --port 8000` in the `backend` directory.

## Architecture & Key Concepts

- **Monorepo Structure:** Frontend and backend code are in the same repository but are separate applications.
- **Authentication Flow:** The application uses a hybrid authentication model that leverages Firebase for identity verification and a custom backend for session management. This provides the security and convenience of Firebase Auth while giving the application full control over user sessions.
    1.  **Step 1: Firebase Authentication (Client-Side):** The user signs in or signs up on the frontend using the Firebase SDK (Google OAuth or email/password). Upon success, the client receives a short-lived Firebase ID Token.
    2.  **Step 2: Backend Session Handshake:** The frontend immediately sends the Firebase ID Token to the backend's `/api/v1/auth/session-login` endpoint. The backend, using the Firebase Admin SDK, verifies the token's authenticity. If valid, it creates or retrieves the user from its own database and generates a secure, `HttpOnly` session cookie named `__session`.
    3.  **Step 3: Session Persistence & Middleware:** The browser stores this `__session` cookie and automatically sends it with every subsequent request to the backend. The `middleware.ts` intercepts all page navigations, checks for this cookie, and makes a server-to-server call to the backend's `/api/v1/users/me/status` endpoint to determine if the user is authorized to access the requested route based on their account status (e.g., `AWAITING_ONBOARDING`, `ACTIVE`).
    4.  **Step 4: Client-Side State Hydration:** Once a user is on a protected page, the `UserContext.tsx` (powered by React Query) makes a client-side request to `/api/v1/users/me` to fetch the full, detailed user profile. The `RouteGuard.tsx` component uses this data to manage the UI state, such as showing loading spinners or performing client-side redirects, ensuring a smooth user experience.
- **Routing:** Next.js App Router is used.
    - `(app)`: Main application routes (authenticated).
    - `(auth)`: Authentication-related routes.
- **State Management:** Global user state is managed via `UserContext.tsx` and React Query.

## Directory Structure

- `src/app`: Next.js routes.
    - `(app)`: Authenticated routes.
    - `(auth)`: Authentication routes.
- `src/components`: Reusable React components.
- `src/contexts`: React context providers (notably `UserContext.tsx`).
- `src/lib`: Core utility functions and API calls.
- `src/middleware.ts`: Handles route protection.
- `backend/`: Contains the entire Python FastAPI backend.
