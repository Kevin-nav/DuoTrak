# Goals Management

This feature allows users to view, create, and manage their personal and shared goals within the DuoTrak application. It provides a dashboard-like interface to display goals, with basic search functionality.

## 1. Goal Creation Flow

The goal creation process is a multi-step wizard designed to guide users through defining their objectives and generating actionable plans. It starts with selecting the type of goal.

### Step 1: Choose Goal Type (`src/components/goal-type-selector.tsx`)

This is the initial screen where the user decides if the goal is personal or shared.

*   **Question:** "What kind of goal?"
*   **Input Method:** The user selects one of two large **Buttons**.
*   **Options:**
    1.  **"Just for Me"**: For personal goals.
    2.  **"With My Duo"**: For shared goals with a partner.

### Step 2 (Option A): Personal Goal Wizard (`src/components/goal-creation-wizard.tsx`)

If "Just for Me" is selected, the user proceeds through this 5-step wizard:

*   **Screen 1: Your Goal**
    *   **Question:** "What do you want to achieve?"
    *   **Input Method:** A **Text Field**.

*   **Screen 2: Your Why**
    *   **Question:** "What drives you?"
    *   **Input Method:** A **Text Area**.

*   **Screen 3: Your Schedule**
    *   **Question:** "When can you work on this?"
    *   **Input Method:** **Checkboxes** (user can select multiple).
    *   **Options:** `Mornings (6-9 AM)`, `Lunchtime (12-2 PM)`, `Evnings (6-9 PM)`, `Weekends only`, `I'm flexible`.

*   **Screen 4: Time Investment**
    *   **Question:** "How much time can you dedicate?"
    *   **Input Methods:** This screen has both **Radio Buttons** (for pre-defined options) and a **Text Field** (for a custom entry).
    *   **Radio Button Options:** `15-30 mins daily`, `1 hour weekly`, `Suggest optimal based on my input`.

*   **Screen 5: Accountability**
    *   **Question:** "How will you track completion?"
    *   **Input Methods:** This screen uses **Radio Buttons**. If the second option is chosen, a **Text Field** appears.
    *   **Radio Button Options:** `Visual Proof (Recommended)`, `Time-Bound Action`.

### Step 2 (Option B): Shared Goal Wizard (`src/components/shared-goal-wizard.tsx`)

If "With My Duo" is selected, the user proceeds through this 5-step wizard:

*   **Screen 1: Shared Goal**
    *   **Question:** "What do you and [Partner's Name] want to achieve?"
    *   **Input Method:** A **Text Field**.

*   **Screen 2: Your Why**
    *   **Question:** "Why is this goal important to both of you?"
    *   **Input Method:** A **Text Area**.

*   **Screen 3: Combined Schedule**
    *   **Question:** "Tell us about your combined availability"
    *   **Input Methods:** This screen uses **Checkboxes** and a **Text Field**.
    *   **Checkbox Options:** `Early Mornings (6-8 AM)`, `Lunch Break (12-2 PM)`, `Evenings (6-9 PM)`, `Weekend Mornings`, `Weekend Evenings`, `We're flexible`.

*   **Screen 4: Time Together**
    *   **Question:** "How much time will you dedicate together?"
    *   **Input Methods:** This screen uses **Radio Buttons** and a **Text Field**.
    *   **Radio Button Options:** `30 mins daily together`, `1 hour, 3x per week`, `2 hours on weekends`, `Suggest optimal based on our input`.

*   **Screen 5: Duo Accountability**
    *   **Question:** "How will you ensure accountability?"
    *   **Input Methods:** This screen uses **Radio Buttons**. If the second option is chosen, a **Text Field** appears.
    *   **Radio Button Options:** `Strict Photo Verification (Recommended)`, `System-Verified Punctuality`.

## 2. Goal Management

### `src/components/goals-home.tsx`

This component serves as the central hub for displaying and managing a user's goals. It fetches goal data from the backend using the `useGoals()` hook and displays them in a searchable list. While the UI elements for editing, deleting, and archiving goals are present, their full backend integration is part of future development milestones.

### API Endpoints

*   `GET /api/v1/goals/`: Retrieves all goals for the authenticated user.
*   `POST /api/v1/goals/onboarding`: Creates the initial goal and task during the onboarding process.

