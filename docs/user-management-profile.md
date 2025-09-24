# User Management & Profile

## Description
This feature allows users to view and manage their personal profile information within the DuoTrak application. It covers displaying user details, updating personal information (like email, password, timezone, notification preferences, and a partner-facing nickname), and managing their profile picture. It also provides endpoints for middleware to check user status and for public checks of user existence by email.

## Frontend Implementation

### Pages/Routes
- `src/app/(app)/profile/page.tsx`:
    - **Purpose:** The main user profile page.
    - **Mechanism:** Uses `useUser` from `@/contexts/UserContext` to fetch `userDetails` and `isLoading` status. Renders `FullPageSpinner` during loading or if `userDetails` are unavailable. Once loaded, it displays the `ProfileContent` component within a `DashboardLayout`.

### Components
- `src/components/profile-content.tsx`:
    - **Purpose:** Displays and allows editing of user profile information.
    - **Mechanism:**
        - Fetches `userDetails`, `isLoading`, `refetchUserDetails`, and `signOut` from `useUser` context.
        - **Profile Header:** Displays the user's `full_name`, `profile_picture_url`, email, and badges (current streak, goals conquered, partner status). The `full_name` is used for display, and `profile_picture_url` for the avatar image source.
        - **Email Update:** Uses a dialog. Requires re-authentication with current password via Firebase (`reauthenticateWithCredential`, `updateEmail`). Updates email on backend via `apiFetch` to `/api/v1/users/me`.
        - **Progress Overview:** Displays `current_streak`, `longest_streak`, `total_tasks_completed`, `goals_conquered`.
        - **Theme & Appearance:** Integrates `ThemeSwitcher`.
        - **Settings & Preferences:**
            - **Notifications:** Toggle `notifications_enabled` via `Switch`. Updates backend via `apiFetch` to `/api/v1/users/me`.
            - **Change Password:** Uses a dialog. Requires re-authentication with current password via Firebase (`reauthenticateWithCredential`, `updatePassword`).
            - **Nickname Management:** Allows the user to set a `nickname` that their partner will see. This `nickname` is saved via `apiFetch` to `/api/v1/users/me`.
            - **Timezone:** Selects timezone. Updates backend via `apiFetch` to `/api/v1/users/me`.
        - **Partner Connection:** Conditionally displays partner details (`partner_full_name`, `partner_nickname`) if `userDetails.partner_id` is present.
        - **Sign Out:** Triggers `signOut` from `useUser` context.
    - **Dependencies:** `useUser`, `apiFetch`, `toast`, Firebase auth functions, `shadcn/ui` components, `framer-motion`.

### Contexts/Hooks/Libs
- `src/contexts/UserContext.tsx`: Provides the authenticated user's data to the profile page and other components, ensuring consistent user information across the application. The `UserDetails` interface now includes `nickname: string | null;` for the current user's partner-facing nickname, in addition to `partner_full_name` and `partner_nickname` for the connected partner.
- `src/lib/api/client.ts` (inferred, used by `profile-content.tsx`): Contains client-side functions for interacting with backend user-related endpoints (e.g., `getCurrentUser`, `updateUser`, `uploadProfilePicture`, `removeProfilePicture`).

### Data Flow (Frontend)
1.  `profile/page.tsx` uses `UserContext` to get `userDetails`.
2.  `profile-content.tsx` displays `userDetails` and provides UI for updates.
3.  Email, password changes are handled directly with Firebase authentication after re-authentication.
4.  Notification settings, timezone, and **nickname** updates are sent to `PATCH /api/v1/users/me` via `apiFetch`.
5.  Profile picture uploads are sent to `POST /api/v1/users/me/profile-picture` via `apiFetch`.
6.  Profile picture removals are sent to `DELETE /api/v1/users/me/profile-picture` via `apiFetch`.
7.  `refetchUserDetails` is called after successful updates to refresh the global user state.

## Backend Implementation

### API Endpoints
- `backend/app/api/v1/endpoints/users.py`:
    - **`get_current_user_from_cookie` (Dependency):** Extracts `__session` cookie, decodes JWT, fetches `User` from DB using `user_service.get_user_by_id`, ensuring authentication for protected endpoints.
    - **`GET /me` (response_model=UserRead):** Retrieves the complete profile for the authenticated user.
    - **`GET /me/status` (response_model=MiddlewareStatusResponse):** Lightweight endpoint for frontend middleware to check `account_status` and `has_pending_invitation`.
    - **`PATCH /me` (response_model=UserRead):** Updates the authenticated user's profile. Takes `UserUpdate` schema and calls `user_service.update_user`. This endpoint now handles updates to the user's `nickname` which is then reflected in the associated `Partnership` record.
    - **`POST /me/profile-picture` (response_model=UserRead):** Uploads a profile picture. Uses `storage_service.upload_avatar` and updates `profile_picture_url` via `user_service.update_user`.
    - **`DELETE /me/profile-picture` (response_model=UserRead):** Removes profile picture. Uses `storage_service.remove_avatar` and sets `profile_picture_url` to `None` via `user_service.update_user`.
    - **`GET /status-by-email` (response_model=UserStatusResponse):** Public endpoint to check user existence by email and retrieve `partnership_status` via `user_service.get_user_by_email`.

### Services
- `backend/app/services/user_service.py`:
    - **Purpose:** Encapsulates business logic for user data management.
    - **Methods:**
        - `has_pending_invitation(db, user)`: Checks for pending partner invitations sent by the user.
        - `get_user_by_firebase_uid(db, firebase_uid)`: Retrieves user by Firebase UID.
        - `get_user_by_email(db, email)`: Retrieves user by email.
        - `get_user_by_id(db, user_id)`: Retrieves user by database ID.
        - `sync_user_profile(db, user_in)`: Creates or retrieves user based on Firebase data, handling email conflicts.
        - `update_user(db, user_id, user_in)`: Updates specified fields of an existing user. This method now includes logic to update the `user1_nickname` or `user2_nickname` in the `Partnership` table if a nickname is provided and a partnership exists.

### Schemas
- `app.schemas.user.UserRead`: Pydantic model for reading user data.
- `app.schemas.user.UserUpdate`: Pydantic model for updating user data.
- `app.schemas.user.UserCreate`: Pydantic model for creating new user data.
- `app.schemas.user.AccountStatus`, `app.schemas.user.PartnershipStatus`: Enums for user and partnership states.

### Database Interactions
- Retrieval of user records by ID, Firebase UID, or email.
- Creation of new user records during `sync_user_profile`.
- Updating existing user records (e.g., email, timezone, notification settings, profile picture URL, **nickname**).
- Checking for pending partner invitations.

### Models
- `backend/app/db/models/user.py`: The `User` model now includes a `nickname` column.
- `backend/app/db/models/partnership.py`: The `Partnership` model includes `user1_nickname` and `user2_nickname` columns, which are updated by the `user_service`.

## Dependencies/Integrations
- **Authentication & Authorization Feature:** Relies heavily on the authentication system for user identification and session management.
- **Firebase Authentication:** Used on the frontend for email/password updates and re-authentication.
- **`@tanstack/react-query`:** For efficient client-side data fetching, caching, and synchronization of user profile data.
- **`@/lib/api/client.ts` (apiClient):** Frontend utility for making authenticated API calls to the backend.
- **`@/services/storage_service.py`:** Backend service for handling profile picture uploads and removals.
- **FastAPI:** The web framework hosting the backend user management endpoints.
- **SQLAlchemy:** ORM for asynchronous database interactions with the `User` and `PartnerInvitation` models.
- **Pydantic:** For data validation and serialization of API requests and responses.
- **`fastapi-limiter`:** For rate limiting on API endpoints.