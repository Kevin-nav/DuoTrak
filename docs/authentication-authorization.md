# Authentication & Authorization

## Description
This feature handles user registration, login, session management, password recovery, and ensures that users can only access authorized parts of the application. It leverages Firebase for identity verification and a custom backend for secure session management using HTTP-only cookies and JWTs.

## Frontend Implementation

### Pages/Routes
- `src/app/(auth)/login/page.tsx`: User login interface.
- `src/app/(auth)/signup/page.tsx`: User registration interface.
- `src/app/(auth)/forgot-password/page.tsx`: Interface for initiating password reset.
- `src/app/(auth)/password-reset/page.tsx`: Interface for completing password reset.
- `src/app/(auth)/invite-acceptance/page.tsx`: Handles accepting partner invitations, which often involves authentication.
- `src/app/(auth)/onboarding/page.tsx`: Initial user onboarding flow after authentication.

### Components
- (To be identified after deeper dive into `src/components` for auth-specific components)

### Contexts/Hooks/Libs
- `src/middleware.ts`:
    - **Purpose:** Next.js middleware responsible for route protection and session validation.
    - **Mechanism:** Intercepts all incoming requests. If a `__session` cookie is present, it makes a server-to-server call to the backend's `/api/v1/users/me/status` endpoint to determine if the user is authorized to access the requested route based on their account status (e.g., `AWAITING_ONBOARDING`, `ACTIVE`). It redirects unauthenticated or unauthorized users to appropriate login/onboarding pages.
- `src/contexts/UserContext.tsx`:
    - **Purpose:** Manages global user state, authentication status, and provides functions for user-related actions on the client-side.
    - **Mechanism:** Uses React Context API and `@tanstack/react-query` to fetch and cache user details via `apiClient.getCurrentUser()`. It exposes `userDetails`, `isLoading`, `signOut`, `refetchUserDetails`, and partner-related functions (`sendInvitation`, `withdrawInvitation`, `nudgePartner`).
    - **`signOut` Function:** Orchestrates logout by calling `apiClient.logout()` (backend session termination), `firebaseSignOut()` (Firebase client-side logout), clearing the `react-query` cache, and redirecting to `/login`.
- `src/lib/api/client.ts` (inferred, used by `UserContext.tsx`): Contains client-side functions for interacting with backend authentication endpoints (e.g., `getCurrentUser`, `logout`, `sendInvitation`).
- `src/lib/firebase/auth.ts` (inferred): Likely contains Firebase authentication client-side logic for initial sign-in/sign-up.

### Data Flow (Frontend)
1.  **Initial Authentication:** User signs in/up via Firebase SDK on the frontend (e.g., `src/app/(auth)/login/page.tsx`).
2.  **Session Handshake:** The obtained Firebase ID Token is sent to the backend's `POST /api/v1/auth/session-login` endpoint via `apiClient`.
3.  **Session Persistence:** The backend verifies the token, creates a secure `__session` HTTP-only cookie, and returns it to the browser.
4.  **Route Protection:** For subsequent requests, `src/middleware.ts` intercepts, reads the `__session` cookie, and calls the backend (`/api/v1/users/me/status`) to validate authorization before allowing access to protected routes.
5.  **Client-Side State:** `src/contexts/UserContext.tsx` fetches detailed user profile data from the backend (`apiClient.getCurrentUser()`) and makes it globally available, managing loading states and providing logout functionality.

## Backend Implementation

### API Endpoints
- `backend/app/api/v1/endpoints/auth.py`:
    - **`POST /session-login`:**
        - **Purpose:** Establishes a secure backend session after successful Firebase authentication.
        - **Mechanism:** Receives a Firebase ID token, verifies it using `firebase_admin.auth.verify_id_token`. It then syncs the user profile with the local database via `user_service.sync_user_profile`. Finally, it generates a short-lived JWT session token (1 hour) and a long-lived JWT refresh token (7 days), along with CSRF tokens. These tokens are set as secure, HTTP-only cookies (`__session`, `__refresh`, `csrf_token`) with a dynamically determined domain based on the request origin. Returns user data, session expiration, and the unsigned CSRF token.
    - **`GET /verify-session`:**
        - **Purpose:** Verifies the validity of the current session token.
        - **Mechanism:** Reads the `__session` cookie, decodes and validates the JWT. Returns `valid: true` and user details if the session is active and valid.
    - **`POST /refresh-session`:**
        - **Purpose:** Renews an expired session using a valid refresh token.
        - **Mechanism:** Reads the `__refresh` cookie, decodes and validates the refresh JWT. If valid, it issues a new session token and CSRF token, setting them as new cookies.
    - **`POST /logout`:**
        - **Purpose:** Terminates the user's session.
        - **Mechanism:** Clears all authentication-related cookies (`__session`, `__refresh`, `csrf_token`) from the client.
    - **`GET /csrf-token`:**
        - **Purpose:** Provides a CSRF token for frontend forms that require it.
        - **Mechanism:** Generates and returns an unsigned CSRF token.

### Services
- `backend/app/services/user_service.py` (inferred, used by `auth.py`): Contains logic for creating or updating user profiles in the database based on Firebase authentication data.

### Schemas
- `backend/app/schemas/auth_schemas.py` (inferred): Pydantic models for authentication-related request and response bodies (e.g., `LoginRequest`, `SessionResponse`).
- `backend/app/schemas/user_schemas.py` (inferred): Pydantic models for user data (e.g., `UserCreate`, `UserRead`) used during profile syncing and session responses.

### Database Interactions
- User records are created or updated in the database during the `session-login` process via `user_service`.

## Dependencies/Integrations
- **Firebase Authentication:** Used for initial user identity verification (client-side) and ID token verification (backend).
- **Firebase Admin SDK:** Utilized on the backend (`auth.py`) for secure verification of Firebase ID tokens.
- **JWT (JSON Web Tokens):** Employed for creating secure, stateless session and refresh tokens.
- **HTTP-only Cookies:** Essential for securely storing session and refresh tokens, preventing client-side JavaScript access.
- **CSRF Protection:** Implemented using `fastapi_csrf_protect` to guard against Cross-Site Request Forgery attacks.
- **Next.js Middleware:** Provides server-side route protection and initial authorization checks.
- **React Query:** Used on the frontend (`UserContext.tsx`) for efficient data fetching, caching, and synchronization of user authentication status and profile data.
- **FastAPI:** The web framework hosting the backend authentication endpoints.
- **SQLAlchemy (via `AsyncSession`):** Used for asynchronous database interactions, particularly for syncing user profiles.
- **`backend/app/core/config.py`:**
    - **Purpose:** Defines application-wide settings, including sensitive keys and URLs.
    - **Relevance:** Provides `SECRET_KEY` for JWT signing, `CSRF_SECRET_KEY` for CSRF protection, `SESSION_COOKIE_NAME`, and `REDIS_URL` for rate limiting storage. These are crucial for the security and operation of the authentication system.
- **`backend/app/core/limiter.py`:**
    - **Purpose:** Implements rate limiting for API endpoints.
    - **Relevance:** Protects authentication endpoints (like `/session-login`) from brute-force attacks and abuse by limiting request frequency. Uses `SECRET_KEY` to identify authenticated users for per-user rate limiting.
- **`backend/app/core/security.py`:**
    - **Purpose:** Provides utilities for secure password hashing and verification.
    - **Relevance:** While Firebase handles the primary password authentication flow, this module would be essential if the application were to implement its own password management (e.g., for local accounts or internal admin tools). It ensures that any password storage and verification are done securely using bcrypt.
