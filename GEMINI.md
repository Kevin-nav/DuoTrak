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
- **Authentication Flow:**
    1.  User signs in/up via Firebase on the client.
    2.  Firebase ID token is sent to the backend.
    3.  Backend validates the token, creates a session, and returns an HTTP-only `auth_token` cookie.
    4.  The `middleware.ts` protects routes based on the presence of this cookie.
    5.  The `UserContext.tsx` (powered by React Query) manages user state on the client.
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
