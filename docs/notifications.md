# Notifications

## Description
This feature provides a system for users to receive, view, and manage various types of notifications within the DuoTrak application. It includes a notification center for viewing all alerts and settings for customizing notification preferences.

## Frontend Implementation

### Pages/Routes
- `src/app/(app)/notifications/page.tsx`:
    - **Purpose:** The main entry point for the user's notification center.
    - **Mechanism:** Directly renders the `NotificationCenter` component, passing down placeholder callback functions for various notification actions (e.g., mark as read, archive, snooze, bulk actions).

### Components
- `src/components/notification-center.tsx`:
    - **Purpose:** The central UI for viewing, filtering, searching, and managing notifications.
    - **Mechanism:**
        - Displays a list of notifications, categorized by type (task, partner, progress, system).
        - Provides search functionality and filters by category and archived status.
        - Allows selection of multiple notifications for bulk actions.
        - Renders individual notifications with icons, titles, messages, timestamps, and action buttons (e.g., accept/reject goal invitation, resubmit proof, mark as read, archive).
        - **Crucially, it uses hardcoded mock data for notifications.** All action callbacks (`onMarkAsRead`, `onArchive`, `onNotificationAction`, etc.) are received via props and are currently handled by placeholder functions in `notifications/page.tsx`.
    - **Dependencies:** `framer-motion`, `lucide-react`, `shadcn/ui` components (`Button`, `Input`, `Badge`, `Tabs`, `Card`, `Checkbox`), `MouseGlowEffect`.
- `src/components/notification-settings.tsx`:
    - **Purpose:** Provides a comprehensive interface for users to customize their notification preferences.
    - **Mechanism:**
        - Manages local state for various settings: delivery methods (push, email, in-app), notification types (task reminders, verification requests, partner messages, etc.), timing preferences (quiet hours, frequency), partner-specific settings, and sound/vibration.
        - Uses `Switch` and `Select` components for user input.
        - The `handleSaveSettings` function is a placeholder for sending updated settings to the backend.
    - **Dependencies:** `lucide-react`, `useState`, `shadcn/ui` components (`Button`, `Card`, `Switch`, `Label`, `Select`, `Separator`).
- `src/components/notification-system.tsx`:
    - **Purpose:** A placeholder component for the notification bell icon in the top navigation bar.
    - **Mechanism:** Currently renders only a `Button` with a `Bell` icon. It receives various notification action callbacks as props but does not utilize them in its current placeholder implementation.

### Contexts/Hooks/Libs
- (No specific contexts or hooks identified for fetching notification data, as it's currently mocked.)

### Data Flow (Frontend)
1.  `notifications/page.tsx` renders `NotificationCenter`, passing placeholder action handlers.
2.  `NotificationCenter` displays mock notification data and provides UI for user interaction.
3.  User actions (e.g., marking as read, archiving) trigger the passed-down callbacks, which currently only log to the console.
4.  `NotificationSettings` manages notification preferences locally, with a placeholder for saving to the backend.

## Backend Implementation
- **Absence of Dedicated Endpoints:** There are no dedicated backend API endpoints (e.g., `notifications.py`) found in `backend/app/api/v1/endpoints` for fetching or managing a user's notification feed. This aligns with the frontend components using mock data or placeholder functions for backend interactions.
- Notifications are likely generated internally by other services (e.g., `partner_invitation_service.py` sends emails, but there's no API for fetching a user's notification feed directly).

## Dependencies/Integrations
- **FastAPI:** (Backend framework, though no dedicated notification endpoints are present).
- **SQLAlchemy:** (ORM for database interactions, if notification data were to be persisted).
- **Pydantic:** (For backend data validation, if notification schemas were to be defined).
