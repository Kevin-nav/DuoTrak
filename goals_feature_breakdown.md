# DuoTrak Goals Feature: Technical Breakdown & Implementation Plan (v2)

This document provides a comprehensive analysis of the "Goals" feature in the DuoTrak application, updated with feedback to align with our design principles. It details the current state, component inventory, refined user flows, a more robust API specification, and an adjusted implementation roadmap.

---

## 1. Current State Analysis

The Goals feature, as it exists today, is a **high-fidelity, frontend-only prototype**. The core logic is encapsulated within the `src/components/goals-home.tsx` component.

- **Data Source:** All data is **mock data**, hardcoded directly into the `GoalsHome` component's default props. There is no connection to a backend.
- **State Management:** All state is managed locally within the `GoalsHome` component using React's `useState` hook.
- **Functionality:** The UI simulates a complete and feature-rich user experience. However, none of these actions are persistent.

The current implementation serves as an excellent visual and interactive blueprint. The primary task is to replace the mock data and local state management with a robust server state management system powered by a backend API.

---

## 2. Component Inventory & Architecture

The feature is broken down into several key components.

| Component | File Path | Purpose & Integration Notes |
| :--- | :--- | :--- |
| **`GoalsHome`** | `src/components/goals-home.tsx` | The main container and orchestrator. It will be refactored to use React Query for data fetching and state management. |
| **`GoalDetailView`** | *(To be created)* | **(New)** A dedicated view for a single goal's details. It will display the full description, a list of linked tasks, and an "Edit" button (which will render the `GoalEditor`). Crucially, it will feature a prominent **"View Full Progress & Analytics"** button to navigate to the stats page, filtered for that goal. |
| **`GoalTypeSelector`** | `src/components/goal-type-selector.tsx` | A modal to choose between "Personal" or "Shared" goals. No changes needed. |
| **`GoalCreationWizard`** | `src/components/goal-creation-wizard.tsx` | A multi-step form for creating goals. This will be enhanced to include an **AI-assisted task suggestion step**. |
| **`GoalEditor`** | `src/components/goal-editor.tsx` | A form for editing goals. This component **should reuse the `GoalCreationWizard`'s UI** but be pre-populated with the existing goal's data for a consistent user experience. |
| **`GoalInvitationReview`** | `src/components/goal-invitation-review.tsx` | A component to display pending goal invitations. It will be connected to a dedicated API endpoint. |

---

## 3. Refined User Flow & Technical Integration

### Flow 1: AI-Assisted Goal Creation

1.  **User Action:** Clicks `+` -> Selects "Personal Goal".
2.  **Frontend:** Renders `GoalCreationWizard`. The user enters the goal's name and category.
3.  **Frontend (AI Step):** The wizard proceeds to a "Suggested Tasks" step. It sends an API call: `POST /api/v1/goals/suggest-tasks` with the goal name.
4.  **Backend ("AI" part):** The endpoint uses its logic (ML model or database lookup) to generate relevant, actionable tasks. It returns a list of suggested tasks.
5.  **Frontend:** The wizard displays the suggested tasks in an editable list. The user can modify, delete, or add to these tasks.
6.  **User Action:** Clicks "Create Goal".
7.  **Frontend:** Displays a loading state. Makes an API call: `POST /api/v1/goals` with the goal data and the final list of tasks.
8.  **Backend:** Validates the data, creates the `Goal` and associated `Task` records in the database, and returns the new `Goal` object.

### Flow 2: Goal Completion & Celebration

1.  **User Action:** A user marks the final task of a shared goal as complete.
2.  **Frontend:** The UI updates optimistically. An API call is made to update the task's status.
3.  **Backend:**
    - Updates the task's status.
    - A trigger or service checks if this was the last task for the goal. If so, it updates the `Goal` record's status to `completed`.
    - It then fires two notifications:
        - To the user who completed the goal: "You did it! Goal Complete!"
        - To the partner: "Your partner just completed a goal: [Goal Name]! 🎉"
4.  **Frontend:**
    - On receiving the successful API response confirming the goal is complete, the frontend triggers a **full-screen celebration animation** (e.g., confetti, stars).
    - The goal is moved to the "Completed" tab in the `GoalsHome` view.

---

## 4. Enhanced API Specification

| Method | Path | Description | Request Body | Success Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/goals` | Fetches all goals for the user. | (None) | `200 OK` with `[Goal]` |
| `GET` | `/api/v1/goals/{goalId}` | Fetches a single goal with its associated tasks. | (None) | `200 OK` with `Goal` (including `tasks` array) |
| `POST` | `/api/v1/goals` | Creates a new personal goal. | `{ name, category, icon, color, tasks: [...] }` | `201 Created` with `Goal` |
| `PUT` | `/api/v1/goals/{goalId}` | Updates an existing goal. | `{ name, category, icon, color, ... }` | `200 OK` with `Goal` |
| `DELETE` | `/api/v1/goals/{goalId}` | Deletes a goal. | (None) | `204 No Content` |
| `POST` | `/api/v1/goals/shared` | Creates a shared goal and sends an invitation. | `{ name, category, icon, color, tasks: [...] }` | `201 Created` |
| `GET` | `/api/v1/goal-invitations` | Fetches pending goal invitations. | (None) | `200 OK` with `[GoalInvitation]` |
| `POST`| `/api/v1/goal-invitations/{invId}/respond` | Responds to an invitation. | `{ "accept": true }` | `200 OK` |
| `POST` | `/api/v1/goals/suggest-tasks` | **(Smart Feature)** Suggests tasks for a goal. | `{ "goal_name": "..." }` | `200 OK` with `{ "suggestions": [...] }` |
| `POST` | `/api/v1/tasks/{taskId}/verify` | Submits a task for verification. | `FormData` with image file | `200 OK` |

*Note: Task-specific endpoints like `/verify` could be moved to a dedicated `/api/v1/tasks` router for better architectural organization.*

---

## 5. Adjusted Path to Completion

### Phase 1: Backend Foundation

1.  **Database Schema:** Update the `Goals` table to include `icon` (string) and `color` (string) fields.
2.  **API Implementation:**
    - Implement `GET /api/v1/goals/{goalId}` to return the goal and its linked tasks.
    - Implement `POST /api/v1/goals` to accept the full goal object, including initial tasks.
    - Build the backend logic for the **goal completion notification** system.
3.  **Scaffold Other Endpoints:** Create stubs for all other goal-related endpoints.

### Phase 2: Frontend Core Integration

1.  **React Query & Refactor:** Refactor `GoalsHome` to use React Query for data fetching.
2.  **Build `GoalDetailView`:** Create the new component for viewing a single goal's details and implement the navigation to the filtered "Progress & Analytics" page.
3.  **Connect `GoalCreationWizard` & `GoalEditor`:** Wire up the creation and editing components to the API, ensuring they reuse the same UI.
4.  **Implement Celebration:** Build the full-screen goal completion animation and trigger it on a successful API response.

### Phase 3: Shared & Smart Features

1.  **Implement Shared Logic:** Build out the backend logic for shared goals and invitations.
2.  **Connect Invitation UI:** Connect the `GoalInvitationReview` component to the API.
3.  **Build & Integrate AI Suggestions:**
    - Implement the `/api/v1/goals/suggest-tasks` endpoint on the backend.
    - Integrate the AI-assisted, multi-step task suggestion flow into the `GoalCreationWizard`.

This updated plan provides a more complete and refined roadmap for delivering a highly engaging and intelligent Goals feature.