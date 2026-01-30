# Frontend Migration Plan: React Query -> Convex React

## 1. Current State Analysis
*   **Data Fetching**: Uses `@tanstack/react-query` with a custom `apiClient` (REST over fetch).
*   **State Management**: `UserContext` manages global user state, calling `apiClient.getCurrentUser()`.
*   **Authentication**: Firebase Auth (Client SDK) + Custom Session Cookies (`__session`) + CSRF protection.
*   **Real-time**: Not native; relies on manual `refetchUserDetails()` calls after mutations.

## 2. Proposed Architecture
Migrate to **Convex React Hooks**. This eliminates the need for `react-query` (for backend data), manual invalidation, and complex fetch wrappers.

### Key Components to Replace

| Current Component | Convex Equivalent | Benefit |
| :--- | :--- | :--- |
| `apiClient.get('/goals')` | `useQuery(api.goals.list)` | Automatic reactivity (real-time updates). |
| `apiClient.post(...)` | `useMutation(api.goals.create)` | Simple, typed remote function calls. |
| `UserContext` | `ConvexProviderWithAuth` | Built-in Auth integration with Firebase. |
| `useEffect` polling | N/A | Convex handles updates via WebSocket. |

## 3. Migration Steps

### Step 1: Setup Convex Provider
Wrap the application in `ConvexClientProvider`.
```tsx
// src/app/ConvexClientProvider.tsx
"use client";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useAuth } from "@/lib/auth/useAuth"; // Custom hook wrapping Firebase

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
```

### Step 2: Refactor UserContext
Simplify `UserContext.tsx` drastically.
```tsx
// Old
const { data: userDetails } = useQuery({ queryKey: ['user'], queryFn: fetchUser });

// New
const userDetails = useQuery(api.users.current);
// userDetails is undefined while loading, then data. No manual refetch needed.
```

### Step 3: Replace Page Data Fetching
Scan `src/app` for `useEffect` or `useQuery`.
*   **Goals Page**: Replace `useQuery(['goals'], ...)` with `const goals = useQuery(api.goals.list)`.
*   **Task Updates**: Replace `mutation.mutate()` with `const updateTask = useMutation(api.tasks.update); updateTask(...)`.

### Step 4: Hybrid Auth Handling
Since we are keeping the Python Backend for AI, we need to pass the Auth Token to it when calling it via Convex Actions.
*   Convex Actions run on the server and can validate the user via `ctx.auth`.
*   When the Convex Action calls the Python Service, it should pass a secure system secret or the user's token if propagation is needed.

## 4. Specific File Changes

*   `src/lib/apiClient.ts`: **Delete**. No longer needed.
*   `src/lib/api/core.ts`: **Delete**. No longer needed.
*   `src/contexts/UserContext.tsx`: **Refactor** to use Convex hooks.
*   `src/app/(dashboard)/goals/page.tsx` (example): Update to use `useQuery`.

## 5. UI/UX Improvements
With Convex, the UI will update instantly when a partner accepts an invitation or a goal is modified on another device. This fulfills the "flexibility" goal.
