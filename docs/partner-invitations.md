# Partner Invitations

## Description
This feature handles the process of inviting a partner to the DuoTrak application, from sending the invitation to accepting it. It includes frontend forms for sending and accepting invitations, and backend API endpoints to manage the invitation lifecycle.

## Frontend Implementation

### Pages/Routes
- `src/app/(app)/invite-partner/page.tsx`:
    - **Purpose:** Provides a form for an authenticated user to send an invitation to a potential partner.
    - **Mechanism:**
        - Uses `useUser` context to access `sendInvitation` function and user loading state.
        - Employs `react-hook-form` with `zod` for client-side form validation (partner's name and email).
        - On submission, calls `sendInvitation` with the partner's email and name.
        - Redirects to `/onboarding/setup` upon successful invitation.
        - Displays loading state and error messages using `shadcn/ui` components.
    - **Dependencies:** `useUser`, `useRouter`, `react-hook-form`, `zod`, `shadcn/ui` components, `lucide-react`, `@/lib/logger`.

- `src/app/(app)/pending-acceptance/page.tsx`:
    - **Purpose:** Allows a user to accept a partner invitation received via a URL token. This page is accessed by an *authenticated* user who has clicked an invitation link.
    - **Mechanism:**
        - Extracts the invitation `token` from URL search parameters.
        - Fetches invitation details (`sender_name`, `receiver_name`, `expires_at`) from the backend using `apiClient.getPublicInvitationDetails(token)`.
        - If the user is not logged in, redirects them to the login page with a `redirect` parameter to return after authentication.
        - Provides an "Accept Invitation" button which calls `apiClient.acceptInvitation(token)`.
        - Displays loading states, error messages, and success toasts.
        - Redirects to `/dashboard` upon successful acceptance.
    - **Dependencies:** `useSearchParams`, `useRouter`, `useUser`, `Button`, `Card` components, `toast`, `ApiClient`.

- `src/app/(auth)/invite-acceptance/page.tsx`:
    - **Purpose:** Handles the initial landing for a user who clicks on an invitation link, especially for users who might not be logged in or even have an account yet. It verifies the invitation token, displays invitation details, and then intelligently routes the user to either login or signup based on their existing account status and partnership status.
    - **Mechanism:**
        - Extracts the invitation `token` from URL search parameters.
        - Fetches invitation details (`senderName`, `receiverEmail`) from the backend using `apiClient.getPublicInvitationDetails(token)`.
        - Calls `apiClient.getUserStatusByEmail(invitationDetails.receiverEmail)` to check the status of the user associated with the invitation email.
        - **Conditional Routing:**
            - If user exists and is available (`user_exists` is true, `partnership_status` is 'no_partner'): Redirects to `/login?token=${token}`.
            - If user exists but is already partnered: Displays an error.
            - If user does not exist: Redirects to `/signup?token=${token}`.
        - Displays loading states, error messages, and a button to "Accept Invitation" (which triggers the status check and routing).
    - **Dependencies:** `useRouter`, `useSearchParams`, `Button`, `Card` components, `toast`, `apiClient`, `framer-motion`, `lucide-react`.

- `src/app/(app)/onboarding/setup/page.tsx`:
    - **Purpose:** Guides a newly onboarded user (or a user who has just sent/accepted an invitation) through an initial setup process, primarily focused on setting up their first goal and potentially inviting a partner. It acts as a post-authentication/post-invitation landing page.
    - **Mechanism:**
        - Multi-step wizard (`currentStep` state).
        - Uses `useUser` context to get `userDetails` and `refetchUserDetails`.
        - **Goal Creation:** Form to create a goal using `apiClient.createGoal`.
        - **Partner Invitation:** Form to invite a partner using `apiClient.sendInvitation` (similar to `invite-partner/page.tsx`).
        - **Skip Partner:** Option to skip partner invitation, which updates the user's `account_status` to `ACTIVE` via `apiClient.updateUser`. Redirects to `/dashboard` if `userDetails.partner_id` is already set.
    - **Dependencies:** `useUser`, `useRouter`, `react-hook-form`, `zod`, `apiClient`, `toast`, `shadcn/ui` components, `lucide-react`, `framer-motion`.

### Components
- (No dedicated components identified yet, beyond those embedded in pages)

### Contexts/Hooks/Libs
- `src/contexts/UserContext.tsx`: Provides the `sendInvitation` function, which internally calls `apiClient.sendInvitation`.
- `src/lib/api/client.ts`: Contains `ApiClient` class with methods like `sendInvitation`, `getPublicInvitationDetails`, `acceptInvitation`, `getUserStatusByEmail`, `createGoal`, and `updateUser` for interacting with various backend endpoints.
- `src/lib/logger.ts`: Used by `invite-partner/page.tsx` for client-side logging.

### Data Flow (Frontend)
1.  **Sending Invitation:**
    - User fills out the invitation form on `invite-partner/page.tsx` or `onboarding/setup/page.tsx`.
    - `sendInvitation` from `UserContext` (or directly `apiClient.sendInvitation`) is called to send invitation details (partner's name, email) to the backend.
    - Upon success, the inviting user is redirected to `/onboarding/setup`.
2.  **Accepting Invitation (Unauthenticated/New User):**
    - A user navigates to `src/app/(auth)/invite-acceptance/page.tsx` with an invitation `token` in the URL.
    - The page fetches public invitation details and checks the user's status by email.
    - Based on the status, the user is redirected to `/login` (if existing and unpartnered) or `/signup` (if new user), with the `token` preserved.
3.  **Accepting Invitation (Authenticated User):**
    - An authenticated user (potentially after being redirected from `invite-acceptance` or directly accessing) navigates to `pending-acceptance/page.tsx` with an invitation `token` in the URL.
    - The page fetches public invitation details.
    - Upon clicking "Accept Invitation", `apiClient.acceptInvitation(token)` is called.
    - On successful acceptance, the user is redirected to `/dashboard`.

## Backend Implementation

### API Endpoints
- `backend/app/api/v1/endpoints/partner_invitations.py`:
    - **Purpose:** Defines all API endpoints related to managing partner invitations.
    - **Mechanism:**
        - **`get_current_user_from_cookie` (Dependency):** Authenticates requests using the session cookie and fetches the `User` object.
        - **`POST /invite`:** Creates a new partner invitation. Validates against self-invitation, existing partners, and duplicate pending invitations. Delegates creation to `PartnerInvitationService.create_invitation`. Sends an invitation email.
        - **`GET /invitations`:** Lists all invitations for the current user, with optional status filtering and pagination. Delegates to `PartnerInvitationService.get_user_invitations`.
        - **`GET /invitations/{invitation_id}`:** Retrieves a specific invitation by ID, with authorization checks.
        - **`GET /invitations/details/{token}`:** Retrieves public details of an invitation using its token (unauthenticated). Delegates to `PartnerInvitationService.get_public_invitation_details`.
        - **`POST /accept`:** Accepts an invitation using a token. Validates if the user already has a partner. Delegates acceptance to `PartnerInvitationService.accept_invitation_by_token`. Triggers partnership creation and sends acceptance email.
        - **`POST /reject`:** Rejects an invitation. Delegates to `PartnerInvitationService.respond_to_invitation`. Sends rejection email.
        - **`DELETE /invitations/{invitation_id}`:** Revokes a sent invitation. Delegates to `PartnerInvitationService.revoke_invitation`.
        - **`POST /invitations/{invitation_id}/nudge`:** Sends a reminder nudge for a pending invitation. Delegates to `PartnerInvitationService.nudge_invitation`. Applies a rate limit (1/day).
    - **Dependencies:** `PartnerInvitationService`, `UserService`, `jwt`, `limiter`, `schemas`, `models`, `get_db`, `settings`.

### Services
- `backend/app/services/partner_invitation_service.py`:
    - **Purpose:** Encapsulates all business logic for partner invitation operations.
    - **Methods:**
        - `_get_user_by_email`, `_get_invitation_by_token`: Private helpers for data retrieval.
        - `create_invitation(sender, invitation_in)`: Creates invitation, applies validation rules (no self-invite, no invite if already partnered, no duplicate pending invites), persists to DB, and sends email notification via `EmailService`.
        - `accept_invitation_by_token(token, user)`: Finds invitation by token and calls `respond_to_invitation`.
        - `get_public_invitation_details(token)`: Retrieves non-sensitive invitation details.
        - `get_user_invitations(user, status_filter, limit, skip)`: Retrieves invitations for a user.
        - `respond_to_invitation(invitation_id, user, accept)`: Centralized logic for accepting/rejecting. Includes security checks, validation, partnership creation (updates `User` and creates `Partnership` records), and sends email notifications via `EmailService`. Handles database transactions.
        - `revoke_invitation(invitation_id, user)`: Revokes a pending invitation, with authorization checks.
        - `nudge_invitation(invitation_id, user)`: Sends a reminder email for pending invitations via `EmailService`, with rate limiting (1/day).
        - `accept_invitation(db, invitation_id_str, user)`: Convenience function to accept by token string.
    - **Dependencies:** `models.PartnerInvitation`, `models.User`, `models.Partnership`, `schemas`, `EmailService`.

### Schemas
- `backend/app/schemas/partner_invitation.py`:
    - **Purpose:** Defines Pydantic schemas for partner invitation-related data.
    - **Schemas:** `InvitationStatus` (Enum), `PartnerInvitationBase`, `PartnerInvitationCreate`, `PartnerInvitation`, `PartnerInvitationResponse`, `PublicInvitationDetails`, `InvitationAction`, `InvitationActionWithToken`.

### Database Interactions
- Creation of `PartnerInvitation` records.
- Updating `PartnerInvitation` status (PENDING, ACCEPTED, REJECTED, REVOKED, EXPIRED).
- Creation of `Partnership` records upon acceptance.
- Updating `User` records (e.g., `current_partner_id`, `partnership_status`, `account_status`) upon acceptance.
- Retrieval of `PartnerInvitation` and `User` records for validation and display.

## Dependencies/Integrations
- **Authentication & Authorization Feature:** Required for sending invitations and for the accepting user to be authenticated/registered.
- **Email Service:** Used for sending invitation, acceptance, rejection, and nudge emails.
- **FastAPI:** The web framework hosting the backend invitation endpoints.
- **SQLAlchemy:** ORM for asynchronous database interactions with `PartnerInvitation`, `User`, and `Partnership` models.
- **Pydantic:** For backend data validation and serialization/deserialization of API requests and responses.
- **Zod:** For frontend data validation.
- **`fastapi-limiter`:** For rate limiting on backend API endpoints.
- **`backend/app/core/config.py`:** Provides application-wide settings, including `SECRET_KEY` for JWTs, `SESSION_COOKIE_NAME`, and `REDIS_URL` for rate limiting.
- **`backend/app/core/limiter.py`:** Implements the rate limiting logic, using user ID for authenticated requests and IP address for unauthenticated requests.
- **`backend/app/core/security.py`:** Provides utility functions for password hashing and verification (though not directly used in the invitation flow, it's a core security component).
