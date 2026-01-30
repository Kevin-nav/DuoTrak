# Database Migration Plan: Supabase (PostgreSQL) -> Convex

## 1. Current Architecture Analysis
The current application uses a local Supabase (PostgreSQL) database managed by Python/SQLAlchemy models.

### Existing Tables (identified from `backend/app/db/models/`)
*   **Users**: Core user profile, auth details (Firebase UID), stats, partnership status.
*   **Goals**: User goals, linked to User.
*   **Tasks**: Tasks associated with Goals.
*   **Partnerships**: Links two users, tracks status and dates.
*   **PartnerInvitations**: Manages invitation flow between users.
*   **Badges / UserBadges**: Gamification system.
*   **Chats**: Messaging system.
*   **UserBehavioralMetrics**: Analytics/stats.

### Key Observations
*   **IDs**: Uses UUIDs (`uuid.uuid4`). Convex uses its own `Id<TableName>` system. We will need to map these or store the old UUID as a string field if external systems (like Firebase) rely on them, though Convex IDs are superior for internal references.
*   **Enums**: Heavily uses Enums (e.g., `AccountStatus`, `PartnershipStatus`). Convex supports string unions which are effectively the same.
*   **Relationships**: Standard Relational logic (Foreign Keys). Convex uses `v.id("tableName")` for references.
*   **Timestamps**: `created_at` and `updated_at` are ubiquitous. Convex has `_creationTime` built-in, but `updated_at` needs to be managed manually.

## 2. Proposed Convex Schema (`convex/schema.ts`)

Below is the proposed schema definition for Convex.

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    firebase_uid: v.string(), // Keeping for Auth integration
    email: v.string(),
    full_name: v.optional(v.string()),
    account_status: v.string(), // Union: 'AWAITING_ONBOARDING' | 'AWAITING_PARTNERSHIP' | ...
    partnership_status: v.string(), // Union: 'active' | 'pending' | 'no_partner'
    
    // Profile
    bio: v.optional(v.string()),
    profile_picture_url: v.optional(v.string()),
    timezone: v.string(),
    notifications_enabled: v.boolean(),
    notification_time: v.string(),
    theme: v.string(),
    privacy_setting: v.string(),
    
    // Stats
    current_streak: v.number(),
    longest_streak: v.number(),
    total_tasks_completed: v.number(),
    goals_conquered: v.number(),

    // Relationships
    current_partner_id: v.optional(v.id("users")), // Self-reference
    
    updated_at: v.number(), // Timestamp (ms)
  })
  .index("by_firebase_uid", ["firebase_uid"])
  .index("by_email", ["email"]),

  goals: defineTable({
    name: v.string(),
    category: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    is_habit: v.boolean(),
    is_archived: v.boolean(),
    user_id: v.id("users"),
    
    updated_at: v.number(),
  })
  .index("by_user", ["user_id"]),

  tasks: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // 'pending', 'completed', etc.
    repeat_frequency: v.optional(v.string()),
    due_date: v.optional(v.number()), // Timestamp
    goal_id: v.id("goals"),
    
    updated_at: v.number(),
  })
  .index("by_goal", ["goal_id"]),

  partnerships: defineTable({
    user1_id: v.id("users"),
    user2_id: v.id("users"),
    user1_nickname: v.optional(v.string()),
    user2_nickname: v.optional(v.string()),
    status: v.string(), // 'active', 'pending', etc.
    start_date: v.number(),
    end_date: v.optional(v.number()),
    
    updated_at: v.number(),
  })
  .index("by_user1", ["user1_id"])
  .index("by_user2", ["user2_id"])
  .index("by_status", ["status"]),

  partner_invitations: defineTable({
    sender_id: v.id("users"),
    receiver_id: v.optional(v.id("users")),
    receiver_name: v.string(),
    receiver_email: v.string(),
    message: v.optional(v.string()),
    invitation_token: v.string(), // Keep UUID or generate random string
    status: v.string(), // 'pending', 'accepted', etc.
    expires_at: v.optional(v.number()),
    accepted_at: v.optional(v.number()),
    last_nudged_at: v.optional(v.number()),
    
    updated_at: v.number(),
  })
  .index("by_token", ["invitation_token"])
  .index("by_receiver_email", ["receiver_email"]),
  
  // Additional tables for Badges and Chats would follow similar patterns
});
```

## 3. Implementation Steps

1.  **Initialize Convex**: Run `npx convex dev` to set up the project.
2.  **Define Schema**: Create `convex/schema.ts` with the definitions above.
3.  **Migrate Logic**:
    *   Create `convex/users.ts` for user mutations (create, update profile).
    *   Create `convex/goals.ts` for goal management.
    *   Create `convex/tasks.ts`.
    *   Create `convex/partnerships.ts`.
4.  **Replace Frontend Calls**:
    *   Find all `supabase` client calls in `src/`.
    *   Replace with `useQuery` and `useMutation` from `convex/react`.
5.  **Data Migration (Optional)**:
    *   If preserving data is required, write a script to fetch from Supabase (using `supabase-js` admin key) and push to Convex (using `convex` mutations).

## 4. Specific Considerations for this Project

*   **Auth**: The project uses Firebase Auth (`firebase_uid`). Convex integrates well with generic auth providers. We will store the `firebase_uid` in the `users` table and use it to look up the current user.
*   **Backend Logic**: Much logic is in Python (`backend/`). Moving to Convex implies moving this logic to **Convex Functions (TypeScript)**. This is a significant refactor but offers the "flexibility" requested.
    *   *Decision Point*: Do we keep the Python backend for AI/ML tasks and use Convex for data? Or move everything to Convex? 
    *   *Recommendation*: Move data access and standard business logic (CRUD, partnerships) to Convex. Keep Python for heavy AI tasks if they exist (saw `ai`, `agents` folders in `backend/app`), and have Python talk to Convex via HTTP actions or the Convex Python client.
