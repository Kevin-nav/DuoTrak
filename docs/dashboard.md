# Dashboard

## Description
The Dashboard feature provides a personalized overview for the user, aggregating key information about their progress, goals, and partner activities. It serves as the central hub for daily engagement with the DuoTrak application.

## Frontend Implementation

### Pages/Routes
- `src/app/(app)/dashboard/page.tsx`:
    - **Purpose:** The main entry point for the user's dashboard.
    - **Mechanism:** Renders the `DashboardContent` component within a `DashboardLayout`, passing user and partner details from `useUser` context.

### Components
- `src/components/dashboard-layout.tsx`:
    - **Purpose:** Provides the overall structural layout for the dashboard, including a fixed top navigation bar (with logo, brand, and notification system), a main content area, and a fixed bottom navigation bar.
    - **Mechanism:** Manages global navigation state (`activeTab`) and uses `framer-motion` for animations. Integrates `NotificationSystem`.
- `src/components/dashboard-content.tsx`:
    - **Purpose:** The primary content area of the dashboard, orchestrating various smaller components to display aggregated information.
    - **Mechanism:** Receives user and partner data as props. Conditionally renders sections like `VerificationQueue` and partner info. Contains placeholder handlers for task and verification actions.
- `src/components/duo-streak-hero.tsx`:
    - **Purpose:** Displays the user's (and partner's) streak count with motivational messages and visual celebrations for milestones.
    - **Mechanism:** Purely presentational, receives data via props, highly animated using `framer-motion`.
- `src/components/quick-actions.tsx`:
    - **Purpose:** Provides prominent buttons for quick access to key functionalities (e.g., "Create New Shared Goal", "View All Goals", "View Progress").
    - **Mechanism:** Purely presentational, defines appearance and labels; click logic is handled by parent components.
- `src/components/progress-viewer-card.tsx`:
    - **Purpose:** Displays a summary of the user's daily and overall progress (tasks completed, weekly streak, monthly goals).
    - **Mechanism:** Purely presentational, receives data via props, highly animated. Uses dummy data for some metrics.
- `src/components/verification-queue.tsx`:
    - **Purpose:** Displays tasks submitted by a partner that require verification from the current user.
    - **Mechanism:** Purely presentational, receives items and `onVerify`/`onReject` callbacks via props. Uses dummy data for items.
- `src/components/todays-tasks.tsx`:
    - **Purpose:** Displays a list of tasks scheduled for the current day, allowing users to mark completion or submit for verification.
    - **Mechanism:** Purely presentational, receives tasks and callbacks via props. Uses dummy data for tasks. Integrates `TaskVerificationModal`.
- `src/components/goals-highlights.tsx`:
    - **Purpose:** Displays a summary of the user's active goals, categorized into "Personal" and "Shared", showing progress.
    - **Mechanism:** Fetches its own goal data using `useGoals()` and `useUser()`. Purely presentational.
- `src/components/task-verification-modal.tsx`:
    - **Purpose:** A modal component used within `TodaysTasks` to facilitate the submission of visual verification for tasks (e.g., photo upload).
    - **Mechanism:** Manages its own open/close state and handles image selection. Calls an `onSubmit` prop with the task ID and image file.

### Contexts/Hooks/Libs
- `src/contexts/UserContext.tsx`: Provides `userDetails` for user and partner information displayed on the dashboard.
- `src/hooks/useGoals.ts`: Used by `GoalsHighlights` to fetch goal data.
- `src/lib/api/client.ts`: Used by `useGoals` (via `getGoals`) and potentially other components for data fetching.

### Data Flow (Frontend)
1.  `dashboard/page.tsx` retrieves `userDetails` from `UserContext`.
2.  `dashboard/page.tsx` passes relevant `userDetails` to `DashboardContent`.
3.  `DashboardContent` orchestrates various sub-components.
4.  `GoalsHighlights` fetches goal data using `useGoals()` (which calls `apiClient`).
5.  Other components like `DuoStreakHero`, `ProgressViewerCard`, `VerificationQueue`, `TodaysTasks` are currently populated with dummy data or receive data via props, implying that their real data fetching will be handled by parent components or dedicated hooks in future development.
6.  User interactions (e.g., task completion, verification) trigger callbacks passed down as props, which would then interact with backend APIs.

## Backend Implementation
- The Dashboard primarily aggregates data from other features (User, Goals, Partner).
- **API Endpoints:**
    - `backend/app/api/v1/endpoints/users.py`: Provides user profile data (`GET /me`) which includes basic partner information.
    - `backend/app/api/v1/endpoints/goals.py`: Provides goal data (`GET /`) for the `GoalsHighlights` component.
- **Services/Schemas/Database Interactions:** These would be handled by the respective services and schemas of the features from which the dashboard aggregates data (e.g., `user_service.py`, `goal_service.py`, `user.py`, `goal.py` schemas).
- (Specific backend endpoints/services for dashboard-specific aggregations or real-time updates for tasks/activities/chat are not explicitly identified in the current codebase, aligning with the frontend's use of dummy data for these sections.)

## Dependencies/Integrations
- **Authentication & Authorization Feature:** Required for accessing the dashboard.
- **User Management & Profile Feature:** Provides user and partner profile data.
- **Goals Management Feature:** Provides goal data.
- **Partner Management Feature:** Provides basic partner information.
- **`@tanstack/react-query`:** Used for efficient data fetching and caching (e.g., for goals).
- **FastAPI:** Backend framework.
- **SQLAlchemy:** ORM for database interactions.
- **Pydantic:** For backend data validation.
