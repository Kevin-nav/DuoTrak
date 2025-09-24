# DuoTrak AI Goal Coach: Agentic Design Document

## 1. Vision & Goal

The objective is to create a state-of-the-art, AI-powered Goal Coach for DuoTrak. This is not a simple prompt-response system; it is a dynamic, adaptive **agentic system** that deeply personalizes the goal creation process for every user.

The agent's primary goal is to maximize a user's probability of success by generating a hyper-personalized, motivating, and achievable goal plan. It achieves this by learning from the user's past behavior, interacting with them to clarify their needs, and accounting for the unique, collaborative nature of the DuoTrak platform.

The system is designed to be flexible, serving both **brand-new users** (solving the "cold start" problem) and **experienced users** with a rich history, ensuring a high-quality experience for everyone.

## 2. Core Design Principles (Agentic Patterns)

The architecture is a direct implementation of several advanced agentic design patterns:

*   **Multi-Agent Collaboration (Chapter 7):** The system is not a single AI. It is a team of four specialized agents, each with a distinct role, working in concert to produce the final plan.
*   **Memory Management (Chapter 8):** The agent has a long-term memory, allowing it to learn from a user's past successes and failures.
*   **Knowledge Retrieval (RAG) (Chapter 14):** The agent retrieves relevant memories (user history) to inform its decisions, making its plans contextually aware.
*   **Routing (Chapter 2):** The agent dynamically adapts its workflow based on whether the user is new or experienced.
*   **Human-in-the-Loop (Chapter 13):** The agent doesn't just present a plan; it first asks intelligent, clarifying questions, creating an interactive dialogue with the user.
*   **Reflection (Chapter 4):** The system has a built-in "Critic" agent to review and refine its own work, ensuring a high-quality output.
*   **Resource-Aware Optimization (Chapter 16):** The system intelligently allocates computational resources, using faster, cheaper models for simple tasks and more powerful models for complex reasoning.

## 3. Data Sources for Personalization

The agent will synthesize data from multiple sources to build a comprehensive profile of the user.

### 3.1. Real-time User Context

This data is available for all users, including new ones.

*   **Source File:** `src/contexts/UserContext.tsx`
*   **Available Data Points:**
    *   `timezone`: For scheduling tasks at appropriate times.
    *   `partner_full_name`: To frame the goal collaboratively.
    *   `badges`: To infer behavioral traits (e.g., "Early Bird" badge suggests success with morning tasks).

```typescript
// src/contexts/UserContext.tsx

export interface UserDetails {
    // ... other fields
    timezone: string | null;
    partner_full_name: string | null;
    badges: any[];
    // ... other fields
}
```

### 3.2. Onboarding Data

This data is collected from the user during the intelligent goal creation step.

*   **Source File:** `src/components/onboarding/IntelligentGoalCreationStep.tsx`
*   **Available Data Points:**
    *   The user's chosen high-level goal (e.g., "Cook at Home Challenge").
    *   Answers to contextual follow-up questions (e.g., dietary preferences, app usage).

### 3.3. Historical Behavioral Metrics (The Memory Layer)

This data is available for existing users and is the core of our deep personalization.

*   **Source:** A new `user_behavioral_metrics` table in our PostgreSQL database, populated by a periodic background job.
*   **Available Metrics:**
    *   **`time_of_day_success`**: A JSON object showing the user's task completion rate for "morning," "afternoon," and "evening."
    *   **`procrastination_index`**: A float representing the average time between a task's due date and its completion.
    *   **`category_affinity`**: A JSON object showing the user's success rates per goal category.
    *   **`archetype`**: A string classifying the user's behavior (e.g., "Marathoner," "Sprinter").

## 4. The Agentic Workflow: A Multi-Agent System

The system is composed of four distinct agents that collaborate in a sequence.

### Agent 1: The User Profiler

*   **Task:** To create a rich, evidence-based profile of the user.
*   **Model:** `gemini-1.5-flash`
*   **Resource Allocation:** `thinking_budget=0` (for speed).
*   **Process:**
    1.  Receives the user's ID.
    2.  Calls the `getUserProfile` tool to retrieve the user's historical data from the memory layer (PostgreSQL and Pinecone).
    3.  Synthesizes this data into a structured JSON object that includes the user's **Behavioral Archetype** and the **rubrics** that define each metric.
    4.  For new users, it returns a "Newcomer" profile.

### Agent 2: The Interactive Question Agent

*   **Task:** To ask the most insightful clarifying questions.
*   **Model:** `gemini-1.5-flash`
*   **Resource Allocation:** `thinking_budget=0`.
*   **Process:**
    1.  Receives the User Profile from Agent 1 and the user's chosen high-level goal.
    2.  Selects 2-3 questions from a "Question Bank" based on the user's archetype and goal type (including questions about external app integration).
    3.  Presents these questions to the user via the UI.

### Agent 3: The Goal Strategist (The Core Engine)

*   **Task:** To generate the hyper-personalized goal plan.
*   **Model:** `gemini-1.5-pro` (or `gemini-1.5-flash`)
*   **Resource Allocation:** `thinking_budget=-1` (dynamic thinking for maximum quality).
*   **Process:**
    1.  Receives the most comprehensive context: the User Profile, the goal, and the user's answers to *all* questions.
    2.  The prompt instructs the agent to synthesize all of this information, explicitly telling it to:
        *   Schedule tasks during the user's "golden hours."
        *   Adjust task complexity based on their archetype.
        *   Frame the plan collaboratively, using the partner's name.
        *   Integrate any external apps the user mentioned.
    3.  Generates the full plan, including tasks, tips, and goal type.

### Agent 4: The Critic (Reflection)

*   **Task:** To review and refine the generated plan.
*   **Model:** `gemini-1.5-pro` (or `gemini-1.5-flash`)
*   **Resource Allocation:** `thinking_budget=-1`.
*   **Process:**
    1.  Receives the plan from the Goal Strategist and the User Profile.
    2.  Evaluates the plan against the user's profile for coherence and achievability.
    3.  If the plan is good, it approves it. If not, it provides a critique and sends it back to the Goal Strategist for another iteration.

## 5. Technical Implementation: The Memory Layer

The memory layer uses a hybrid approach for performance and semantic richness.

### 5.1. PostgreSQL: The Source of Truth

*   **Purpose:** Stores all raw, structured user actions (goals, tasks, timestamps).
*   **New Table:** `user_behavioral_metrics` will be added to store the calculated metrics.
*   **Data Flow:** A periodic background job will read from the `goals` and `tasks` tables and write the calculated metrics to the `user_behavioral_metrics` table.

### 5.2. Pinecone: The Agent's Semantic Memory

*   **Purpose:** Stores vector embeddings of "Behavioral Snapshots" for high-speed, context-aware retrieval.
*   **Data Flow:** The same background job will:
    1.  Use a Gemini model to generate a natural language summary of the user's performance for the last period (a "Behavioral Snapshot").
    2.  Use a text embedding model to convert this snapshot into a vector.
    3.  Upsert this vector into a Pinecone index with the `user_id` as metadata.

### 5.3. The RAG Tool: `getUserProfile`

This tool is the bridge between the agent and its memory.

*   **Source File:** `backend/app/services/ai_suggestion_service.py` (or a new dedicated file).
*   **Logic:**
    1.  Takes a `user_id` and the user's new `goal_title` as input.
    2.  Embeds the `goal_title` into a query vector.
    3.  Performs a similarity search in Pinecone (filtered by `user_id`) to retrieve the most semantically relevant "Behavioral Snapshots."
    4.  Retrieves the latest calculated metrics from the PostgreSQL `user_behavioral_metrics` table.
    5.  Combines both sets of data into the final, rich JSON context object (with rubrics) and returns it.

## 6. Extensibility: Designing for the Future

The multi-agent architecture is inherently extensible. Future AI features, such as the **"Opportunity Agent"** (for suggesting competitions or complementary goals), can be added as new, independent agents to the system without requiring a full redesign. This agent would be triggered upon goal completion and would follow a similar "analyze -> plan -> suggest" workflow.

---

## Appendix A: Data Model & Background Service

This appendix provides the specific technical details required to build the agent's memory layer.

### A.1. New Database Table Schema

The following table must be added to the PostgreSQL database to store the calculated behavioral metrics for each user.

**Table Name:** `user_behavioral_metrics`

```sql
CREATE TABLE user_behavioral_metrics (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    time_of_day_success JSONB,
    procrastination_index FLOAT,
    category_affinity JSONB,
    archetype VARCHAR(50),
    last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### A.2. Background Service Logic

A background service (e.g., a scheduled Python script) must be created to perform the following logic periodically (e.g., every 24 hours) for each user in the system.

**1. Calculate `time_of_day_success`:**
   - Query all of the user's completed tasks from the `tasks` table.
   - For each task, categorize its completion timestamp into "morning" (6am-12pm), "afternoon" (12pm-6pm), or "evening" (6pm-12am) based on the user's `timezone`.
   - Calculate the percentage of tasks completed in each window.
   - Store as a JSON object: `{"morning": 0.85, "afternoon": 0.60, "evening": 0.55}`.

**2. Calculate `procrastination_index`:**
   - Query all completed tasks that had a `due_date`.
   - For each task, calculate the difference in hours between the `completed_at` and `due_date` timestamps.
   - Calculate the average of these differences.
   - Store as a float.

**3. Calculate `category_affinity`:**
   - Query all of the user's goals from the `goals` table.
   - For each goal category (e.g., "Fitness", "Learning"), calculate the success rate (percentage of goals in that category marked as "Completed").
   - Store as a JSON object: `{"Fitness": 0.75, "Learning": 0.90}`.

**4. Determine `archetype`:**
   - Use a rules engine based on the calculated metrics:
     - **IF** `longest_streak` > 30 AND `time_of_day_success` shows a strong preference for one window, assign **"Marathoner"**.
     - **IF** average goal duration < 14 days AND `procrastination_index` is low, assign **"Sprinter"**.
     - **IF** `goals_conquered` is high but `procrastination_index` is high, assign **"Visionary"**.
     - (Define other rules as needed).

**5. Update Database:**
   - `UPSERT` the calculated metrics into the `user_behavioral_metrics` table for the user.
   - Update the `last_updated_at` timestamp.

---

## Appendix B: AI Model & Resource Allocation Strategy

This appendix details the specific AI models and resource configurations for each agent in the system, implementing the **Resource-Aware Optimization** pattern.

### B.1. Simple, Fast Agents

These agents are designed for speed and low cost, handling simple classification and selection tasks.

*   **Agents:**
    *   User Profiler
    *   Interactive Question Agent
*   **Model:** `gemini-1.5-flash`
*   **Configuration:**
    ```python
    # backend/app/services/ai_suggestion_service.py
    
    import google.generativeai as genai
    from google.generativeai import types

    fast_agent_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=0)
    )
    ```
*   **Rationale:** Setting `thinking_budget=0` disables the model's extended reasoning process, resulting in the fastest possible response time and lowest cost. This is ideal for the deterministic tasks these agents perform.

### B.2. Complex, Creative Agents

These agents are the core of the system, requiring deep reasoning to generate and refine high-quality, personalized plans.

*   **Agents:**
    *   Goal Strategist
    *   Critic
*   **Model:** `gemini-1.5-pro` (or `gemini-1.5-flash` as a fallback)
*   **Configuration:**
    ```python
    # backend/app/services/ai_suggestion_service.py

    import google.generativeai as genai
    from google.generativeai import types

    creative_agent_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=-1)
    )
    ```
*   **Rationale:** Setting `thinking_budget=-1` enables **dynamic thinking**. The model will automatically scale its internal reasoning process based on the complexity of the user's goal and context. This provides the best balance of quality and efficiency, allocating more "thought" to complex goals and less to simpler ones.
