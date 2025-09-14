# Goals Management

## Description
This feature allows users to view and manage their personal goals within the DuoTrak application. It provides a dashboard-like interface to display goals, with basic search functionality. The current implementation focuses on reading existing goals, with creation, update, and deletion functionalities planned for future development.

## Frontend Implementation

### Pages/Routes
- `src/app/(app)/goals/page.tsx`:
    - **Purpose:** The entry point for the goals management section.
    - **Mechanism:** This page is a simple wrapper that renders the `GoalsHome` component, passing minimal props.

### Components
- `src/components/goals-home.tsx`:
    - **Purpose:** The central component for displaying and managing a user's goals.
    - **Mechanism:**
        - **Data Fetching:** Uses the `useGoals()` custom hook to fetch a list of `GoalRead` objects from the backend.
        - **State Management:** Manages local UI states such as `activeTab` (personal/shared), `showTypeSelector`, `showPersonalWizard`, `showSharedWizardState`, `showReview`, `selectedGoal`, `showGoalEditor` for various modals and editors (though many are currently disabled).
        - **Search Functionality:** Filters displayed goals based on `searchQuery` matching `goal.name` or `goal.category`.
        - **Goal Display:** Iterates through `filteredGoals` and renders each goal, showing its name, category, creation date, and number of tasks. Uses `framer-motion` for animations and `MouseGlowEffect` for visual flair.
        - **Empty State:** Displays a dynamic message when no goals are found or no search results are present.
        - **Disabled Functionality:** Many goal management actions (create, edit, delete, archive, duplicate, save) are present as handlers but are currently disabled or commented out, indicating they are part of future development milestones.
    - **Dependencies:** `useGoals` hook, `GoalRead` schema, `framer-motion`, `lucide-react`, `MouseGlowEffect`, `DashboardLayout`, and other goal-related wizard/editor components (currently unreachable).

### Contexts/Hooks/Libs
- `src/hooks/useGoals.ts`:
    - **Purpose:** A custom React Query hook to fetch the list of goals for the authenticated user.
    - **Mechanism:** Uses `useQuery` from `@tanstack/react-query` with `queryKey: ['goals']` and `queryFn: getGoals` (from `@/lib/api/goals`).
- `src/lib/api/goals.ts`:
    - **Purpose:** Provides client-side functions for interacting with the backend goals API.
    - **`getGoals` Function:** Asynchronously fetches an array of `GoalRead` objects by making a GET request to `/api/v1/goals/` using `apiClient.get`.
- `src/schemas/goal.ts`:
    - **Purpose:** Defines the Zod schemas (`TaskSchema`, `GoalSchema`) for client-side data validation and type inference for tasks and goals.
    - **Types:** Exports `TaskRead` and `GoalRead` types.

### Data Flow (Frontend)
1.  `GoalsHome` component calls `useGoals()` hook.
2.  `useGoals()` hook calls `getGoals()` from `@/lib/api/goals.ts`.
3.  `getGoals()` uses `apiClient.get` to make an HTTP GET request to `/api/v1/goals/`.
4.  The backend responds with a list of `GoalRead` objects.
5.  `useGoals()` caches and provides this data to `GoalsHome`.
6.  `GoalsHome` filters and displays the goals.

## Backend Implementation

### API Endpoints
- `backend/app/api/v1/endpoints/goals.py`:
    - **`GET /` (response_model=List[schemas.GoalRead]):**
        - **Purpose:** Retrieves all goals for the currently authenticated user.
        - **Mechanism:**
            - Requires authentication via `get_current_user_from_cookie` dependency.
            - Queries the database for `models.Goal` records where `user_id` matches the authenticated user's ID.
            - Uses `selectinload(models.Goal.tasks)` to eagerly load all associated tasks for each goal.
            - Orders results by `created_at` in descending order.
            - Applies a rate limit of 20 requests per minute.
        - **Dependencies:** `get_current_user_from_cookie`, `get_db`, `schemas.GoalRead`, `models.Goal`, `selectinload`, `limiter`.

### Services
- (No dedicated `goal_service.py` found in the current implementation. Goal retrieval logic is directly within the endpoint.)

### Schemas
- `backend/app/schemas/goal.py`:
    - **Purpose:** Defines Pydantic schemas for `Task` and `Goal` objects, used for API request/response validation and data modeling.
    - **`TaskBase`, `TaskCreate`, `TaskUpdate`, `TaskRead`:** Schemas defining the structure and validation rules for tasks at different stages (base, creation, update, read).
    - **`GoalBase`, `GoalCreate`, `GoalUpdate`, `GoalRead`:** Schemas defining the structure and validation rules for goals at different stages, including nested `Task` schemas.

### Database Interactions
- Retrieval of `Goal` records and their associated `Task` records from the database, filtered by `user_id`.

## Dependencies/Integrations
- **Authentication & Authorization Feature:** Relies on the authentication system to identify the current user for fetching their goals.
- **`@tanstack/react-query`:** Used on the frontend for efficient data fetching and caching of goals.
- **FastAPI:** The web framework hosting the backend goals API endpoint.
- **SQLAlchemy:** ORM for asynchronous database interactions with the `Goal` and `Task` models.
- **Pydantic:** For data validation and serialization/deserialization of API requests and responses on the backend.
- **Zod:** For client-side data validation and type inference of goal and task data.
- **`fastapi-limiter`:** For rate limiting on the goals API endpoint.
