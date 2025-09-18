# Technical Specification: AI-Powered Goal & Task Suggestion Engine

## 1. Overview

This document outlines the technical requirements for implementing a new AI-powered feature in the DuoTrak application. The goal is to replace the current mock "AI suggestion" in the goal creation wizards with a real service that provides users with intelligent, actionable, and personalized tasks for their goals.

This feature will be powered by a generative AI model (e.g., Gemini 2.5 Flash) via a new, secure backend endpoint. The primary objective is to enhance user engagement by transforming a user's abstract goal into a concrete, easy-to-follow plan, thereby increasing their likelihood of success.

## 2. Current Frontend Implementation: The User's Journey

The frontend has a detailed, multi-step process for capturing a user's goal. This section details every screen, question, and option presented to the user. This collected data will serve as the primary input for the AI engine.

### Flow Part 1: Choosing the Goal Type
This is the first screen the user sees, controlled by `src/components/goal-type-selector.tsx`.

*   **Question:** "What kind of goal?"
*   **Input Method:** The user must click one of two large **Buttons**.
*   **Options:**
    1.  **"Just for Me"**: For personal goals.
    2.  **"With My Duo"**: For shared goals with a partner.

--- 

### Flow Part 2 (Option A): The Personal Goal Wizard
If the user chooses "Just for Me," they see the wizard from `src/components/goal-creation-wizard.tsx`.

*   **Screen 1: Your Goal**
    *   **Question:** "What do you want to achieve?"
    *   **Input Method:** A **Text Field**.

*   **Screen 2: Your Why**
    *   **Question:** "What drives you?"
    *   **Input Method:** A **Text Area**.

*   **Screen 3: Your Schedule**
    *   **Question:** "When can you work on this?"
    *   **Input Method:** **Checkboxes** (user can select multiple).
    *   **Options:** `Mornings (6-9 AM)`, `Lunchtime (12-2 PM)`, `Evenings (6-9 PM)`, `Weekends only`, `I'm flexible`.

*   **Screen 4: Time Investment**
    *   **Question:** "How much time can you dedicate?"
    *   **Input Methods:** This screen has both **Radio Buttons** (for pre-defined options) and a **Text Field** (for a custom entry).
    *   **Radio Button Options:** `15-30 mins daily`, `1 hour weekly`, `Suggest optimal based on my input`.

*   **Screen 5: Accountability**
    *   **Question:** "How will you track completion?"
    *   **Input Methods:** This screen uses **Radio Buttons**. If the second option is chosen, a **Text Field** appears.
    *   **Radio Button Options:** `Visual Proof (Recommended)`, `Time-Bound Action`.

--- 

### Flow Part 2 (Option B): The Shared Goal Wizard
If the user chooses "With My Duo," they see the wizard from `src/components/shared-goal-wizard.tsx`.

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

## 3. Questions for Backend & AI Implementation

To move from the current mock implementation to a live AI service, we need to define the backend architecture. The following are points for discussion and clarification.

### 3.1. Defining the Suggestion Endpoint
Should we create a new endpoint for this? A possible approach could be:

-   **Route:** `POST /api/v1/goals/suggest-tasks`
-   **Purpose:** To accept goal details and return AI-generated task suggestions.
-   **Authentication:** How should we ensure the user is authenticated for this endpoint?

### 3.2. What Data Should We Use for Personalization?
To provide the best suggestions, what data should the service use? We have access to two main sources:

**1. Goal Creation Data (from Frontend):** The full `formData` object from the wizards.

**2. User Profile Data (from Database):** Should we also fetch the user's profile to provide more context to the AI? The `User` model has several fields that could be relevant.

**Code Snippet: Relevant Fields from the `User` Model (`backend/app/db/models/user.py`)**
```python
class User(Base):
    # ...
    full_name = Column(String(255), nullable=True)
    timezone = Column(String(100), server_default='UTC', default='UTC', nullable=False)
    current_streak = Column(sa.Integer(), server_default='0', default=0, nullable=False)
    longest_streak = Column(sa.Integer(), server_default='0', default=0, nullable=False)
    total_tasks_completed = Column(sa.Integer(), server_default='0', default=0, nullable=False)
    goals_conquered = Column(sa.Integer(), server_default='0', default=0, nullable=False)
    # ...
```

### 3.3. How Should We Integrate the AI Engine?
The plan is to use a Gemini model. The backend endpoint will need to construct a detailed prompt to get the best results.

**Draft Prompt for Discussion:**
Here is a draft prompt template. How can we improve this to get the best possible task list?

```
You are an expert productivity and accountability coach. A user needs help breaking down their goal into actionable tasks. Analyze the user's goal and profile, then generate a list of 3-5 SMART tasks.

Return your response as a valid JSON array of objects with this structure: { "task_name": string, "description": string, "justification": string }.

**User and Goal Information:**

*   **User's Goal:** {goalName}
*   **User's Motivation:** {motivation}
*   **User's Availability:** {availability}
*   **User's Time Commitment:** {timeCommitment}
*   **User's Accountability Method:** {accountabilityType}
*   **User's Timezone:** {timezone}
*   **User's History:** This user has completed {goals_conquered} goals and {total_tasks_completed} tasks. Their current daily streak is {current_streak} days.

Generate the list of tasks. The "justification" should explain why you are suggesting each task.
```

**Backend Logic (Pseudo-code for Discussion):**
Here is a pseudo-code example of how the endpoint logic could look. Is this a good approach?

```python
# In backend/app/api/v1/endpoints/goals.py

from app.services.ai_suggestion_service import get_ai_task_suggestions

@router.post("/suggest-tasks", response_model=List[SuggestedTask])
async def suggest_tasks(
    goal_data: GoalSuggestionRequest,
    current_user: models.User = Depends(get_current_user_from_cookie)
):
    # 1. Construct the prompt using the template and data from goal_data and current_user
    prompt = create_prompt_from_template(goal_data, current_user)
    
    # 2. Call the Gemini API (via a new service)
    # This service will handle the API key and network request
    ai_response_json = await call_gemini_api(prompt)
    
    # 3. Parse and validate the JSON response
    suggested_tasks = parse_ai_response(ai_response_json)
    
    # 4. Return the structured data to the frontend
    return suggested_tasks
```

## 4. Draft API Contract for Review

To ensure clear communication between the frontend and backend, what should the request and response structure look like? Here is a draft for discussion.

**File:** `backend/app/schemas/goal.py`

```python
# --- AI Task Suggestion Schemas ---

class GoalSuggestionRequest(BaseModel):
    goalName: str
    motivation: str
    availability: List[str]
    timeCommitment: str
    customTime: Optional[str] = None
    accountabilityType: str
    timeWindow: Optional[str] = None

class SuggestedTask(BaseModel):
    task_name: str
    description: str
    justification: str

class GoalSuggestionResponse(BaseModel):
    tasks: List[SuggestedTask]

```

## 5. Questions for Frontend Changes

What is the best way to update the frontend to use this new service?

The `generateSuggestion` function in `src/components/goal-creation-wizard.tsx` will need to be updated. Instead of a `setTimeout`, it should make a network request to the new backend endpoint.

**Discussion Point:** Should we use a library like `react-query`'s `useMutation` hook to handle the API call, including loading and error states? The example below shows how that might look.

**Code Snippet: A Potential Approach using `useMutation`**
```typescript
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

// Inside the component...
const { mutate: generateSuggestion, isLoading: isGenerating } = useMutation({
  mutationFn: (goalData: any) => apiClient.post('/api/v1/goals/suggest-tasks', goalData),
  onSuccess: (data) => {
    // How should we map the new `data.tasks` response to the UI state?
  },
  onError: (error) => {
    // How should we communicate errors to the user?
  }
});

const handleGenerateClick = () => {
  generateSuggestion(formData);
};
```
