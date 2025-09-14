# Partner Management

## Description
This feature focuses on the management and interaction aspects of an established partnership within the DuoTrak application. It allows users to view their partner's profile, daily tasks, activity feed, and engage in real-time chat.

## Frontend Implementation

### Pages/Routes
- `src/app/(app)/partner/page.tsx`:
    - **Purpose:** Serves as the entry point for displaying partner-related information.
    - **Mechanism:** A simple wrapper that renders the `PartnerView` component, delegating all UI and interaction logic to it.
    - **Dependencies:** `PartnerView` component.

### Components
- `src/components/partner-view.tsx`:
    - **Purpose:** A comprehensive UI component for displaying a partner's profile, daily tasks, activity feed, and a real-time chat interface. It's designed to foster interaction and support between partners.
    - **Mechanism:**
        - **Data Display:** Renders partner's profile picture, username, local time, timezone, and online status.
        - **Tabbed Interface:** Organizes content into "Day" (partner's tasks), "Activity" (partner's activity feed), and "Chat" (real-time messaging).
        - **"Day" Tab:** Displays a list of partner's tasks with status, scheduled time, progress, notes, and attachments (photos). Includes "Review" functionality for tasks awaiting verification and options to message about a task.
        - **"Activity" Tab:** Shows a feed of partner's activities (task completion, reflections, achievements, duo challenges, system updates) with summaries, details, reactions, and comments.
        - **"Chat" Tab:** Features a full-fledged chat interface with messages grouped by date, support for replies, attachments (images, videos, documents), reactions, and a typing indicator. Includes a message input with dynamic resizing, attachment menu, emoji picker, and a "Nudge" functionality.
        - **Modals:** Implements modals for expanded image view, task detail/verification, and sending nudges.
        - **Local State & Simulation:** Heavily relies on local `useState` hooks for UI state management (e.g., `activeTab`, `newMessage`, `showEmojiPicker`). **Crucially, the component uses hardcoded dummy data for `partner`, `tasks`, `activities`, and `messages`, and simulates chat interactions (e.g., `handleSendMessage` uses `setTimeout` instead of API calls). This indicates it's primarily a presentational component, and actual data fetching/real-time communication is handled elsewhere.**
    - **Dependencies:** `framer-motion`, `date-fns`, `lucide-react`, `MouseGlowEffect`, `DashboardLayout`, and various `shadcn/ui` components.

### Contexts/Hooks/Libs
- `src/contexts/UserContext.tsx`: Provides `userDetails` which includes `partner_id` and `partner_full_name` for basic partner info. This context is the primary source for the current user's partnership status.
- (Other relevant hooks/libs for fetching real partner data for tasks, activities, and chat are expected to be implemented in future development).

### Data Flow (Frontend)
- The `PartnerView` component currently displays partner data using hardcoded dummy data. Real data fetching for partner tasks, activities, and messages is expected to be integrated via other mechanisms (e.g., dedicated hooks, parent components that fetch data from the backend) in future development.

## Backend Implementation

### API Endpoints
- `backend/app/api/v1/endpoints/users.py`:
    - **Relevance:** This file contains endpoints like `GET /me` which can provide the basic profile details of the current user, including their `current_partner_id`. While there isn't a dedicated endpoint to fetch a *partner's* full profile directly by ID, the `GET /me` endpoint could be used by the current user to retrieve their own details, which would include their partner's ID. A separate endpoint might be needed to fetch the partner's full `UserRead` details.
- (Backend endpoints for partner-specific tasks, activities, and chat are not yet identified or implemented in the current codebase, as indicated by the frontend's use of dummy data.)

### Services
- `backend/app/services/user_service.py`:
    - **Relevance:** Used by `users.py` endpoints to retrieve user data, which would include basic partner information if a partnership exists.
- (Backend services for partner-specific tasks, activities, and chat are not yet identified or implemented.)

### Schemas
- `backend/app/schemas/user.py`:
    - **Relevance:** Used for `UserRead` schema, which would contain the basic profile details of the partner.
- (Backend schemas for partner-specific tasks, activities, and chat are not yet identified or implemented.)

### Database Interactions
- Retrieval of partner's basic user profile data via `user_service`.
- (Database interactions for partner-specific tasks, activities, and chat are not yet identified or implemented.)

## Dependencies/Integrations
- **Authentication & Authorization Feature:** Required for the user to access partner management features.
- **`@tanstack/react-query`:** (Likely used for fetching real partner data in future).
- **FastAPI:** (Backend framework for partner management endpoints).
- **SQLAlchemy:** (ORM for database interactions related to partner data).
- **Pydantic:** (For backend data validation).
