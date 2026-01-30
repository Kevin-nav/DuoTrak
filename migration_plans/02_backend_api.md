# Backend Migration Plan: FastAPI -> Convex + Python Service

## 1. Current Architecture Analysis
The current backend is a FastAPI application serving REST endpoints.
*   **CRUD Operations**: Standard database interactions for Users, Goals, Tasks.
*   **AI/ML Logic**: "Agent Crew", "Goal Creation" (Wizard), "AI Suggestion Service". Relies on `Pinecone`, `Gemini`, and Python-specific orchestration.
*   **Authentication**: Firebase Admin SDK.

## 2. Proposed Hybrid Architecture
To leverage Convex's real-time capabilities while maintaining the complex AI logic in Python, we will adopt a **Hybrid Architecture**.

### A. Convex (The "New" Backend)
Convex will replace Supabase and the CRUD parts of the FastAPI app.
*   **Responsibility**:
    *   Primary Database (Users, Goals, Tasks, Partnerships).
    *   Real-time subscriptions for the Frontend.
    *   User Authentication and Profile management.
    *   Simple business logic (creating a goal, completing a task).
*   **Implementation**: Convex Functions (`query`, `mutation`) in `convex/`.

### B. Python AI Service (The "Heavy" Worker)
The existing FastAPI app will be stripped down to focus purely on AI tasks.
*   **Responsibility**:
    *   Running `DuotrakCrewOrchestrator` (Agents).
    *   Interfacing with Pinecone (Vector Search).
    *   Generating detailed AI plans/suggestions.
*   **Interaction**:
    *   **Trigger**: Convex Actions can call the Python Service via HTTP.
    *   **Result**: The Python Service can write results back to Convex using the `convex-python` client or return them in the HTTP response.

## 3. Migration Strategy by Endpoint

| Endpoint Group | Current File | Strategy | Details |
| :--- | :--- | :--- | :--- |
| **Auth** | `auth.py` | **Migrate to Convex** | Use Convex Auth (with Firebase integration). Store user data in Convex `users` table. |
| **Users** | `users.py` | **Migrate to Convex** | `get_current_user`, `update_profile` -> Convex Queries/Mutations. |
| **Goals** | `goals.py` | **Migrate to Convex** | `read_goals`, `create_goal`, `archive_goal` -> Convex Queries/Mutations. |
| **Tasks** | (in `goals.py`) | **Migrate to Convex** | Task creation/updates move to Convex. |
| **Partnerships** | `partner_invitations.py` | **Migrate to Convex** | Invitation flow is logic-heavy but fits Convex Mutations perfectly (real-time updates). |
| **AI Suggestions** | `goals.py` (`suggest_tasks`) | **Keep in Python** | Frontend calls Convex Action -> Convex Action calls Python API -> Python API returns suggestions. |
| **Agent Crew** | `agent_crew.py` | **Keep in Python** | "Wizard" and "Orchestrator" logic remains in Python. |

## 4. Implementation Details

### Step 1: Porting CRUD to Convex
Create TypeScript functions in `convex/` mirroring the logic in `goals.py` and `users.py`.
*   Example: `api.goals.list` query replaces `GET /api/v1/goals`.
*   Example: `api.goals.create` mutation replaces `POST /api/v1/goals`.

### Step 2: Adapting the Python Service
1.  Install `convex` Python client: `pip install convex`.
2.  Update `agent_crew.py` to fetch context (User/Goals) from Convex instead of SQL/Supabase.
3.  Update `agent_crew.py` to write results (Goal Plans) to Convex.

### Step 3: Connecting Convex to Python
Use **Convex Actions** (`convex/actions.ts`) to bridge the gap.
```typescript
// convex/actions.ts
import { action } from "./_generated/server";
import { v } from "convex/values";

export const generatePlan = action({
  args: { userInput: v.object(...) },
  handler: async (ctx, args) => {
    // Call the Python AI Service
    const response = await fetch("https://python-service-url/api/v1/agent/generate", {
      method: "POST",
      body: JSON.stringify(args.userInput),
      headers: { "Content-Type": "application/json" }
    });
    const data = await response.json();
    
    // Optionally write to Convex DB via internal mutation if needed
    // or return data to client
    return data;
  },
});
```

## 5. Security
*   **Convex**: Row Level Security (RLS) via `ctx.auth`.
*   **Python Service**: Secure the endpoint with a secret key (passed from Convex Action headers).
