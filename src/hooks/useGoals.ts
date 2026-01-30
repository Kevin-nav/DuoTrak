import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

// Helper to map Convex Goal to Frontend GoalRead
const mapGoal = (goal: any) => ({
  ...goal,
  id: goal._id,
  userId: goal.user_id,
  isHabit: goal.is_habit,
  createdAt: new Date(goal._creationTime).toISOString(),
  updatedAt: new Date(goal.updated_at || goal._creationTime).toISOString(),
  tasks: goal.tasks.map((task: any) => ({
    ...task,
    id: task._id,
    goal_id: task.goal_id, // Match schema (snake_case)
    created_at: new Date(task._creationTime).toISOString(), // Match schema?
    updated_at: new Date(task.updated_at || task._creationTime).toISOString(),
    due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
  }))
});

export const useGoals = () => {
  const goals = useQuery(api.goals.list);

  // Transform data if loaded
  const data = goals ? goals.map(mapGoal) : undefined;

  return {
    data,
    isLoading: goals === undefined,
    isError: false // Convex handles errors by throwing, boundary catches it, or undefined for loading
  };
};

export const useGoal = (goalId: string) => {
  const goal = useQuery(api.goals.get, goalId ? { id: goalId as Id<"goals"> } : "skip");

  const data = goal ? mapGoal(goal) : undefined;

  return {
    data,
    isLoading: goal === undefined,
    isError: goal === null // null means not found
  };
};

export const useUpdateGoal = (goalId: string) => {
  const update = useMutation(api.goals.update);
  return {
    mutate: (data: any, options?: any) => {
      update({ id: goalId as Id<"goals">, ...data })
        .then(res => options?.onSuccess?.(res))
        .catch(err => options?.onError?.(err));
    }
  };
};

export const useArchiveGoal = () => {
  const archive = useMutation(api.goals.archive);
  return {
    mutate: (goalId: string, options?: any) => {
      archive({ id: goalId as Id<"goals"> })
        .then(res => options?.onSuccess?.(res))
        .catch(err => options?.onError?.(err));
    }
  };
};

export const useDuplicateGoal = () => {
  const duplicate = useMutation(api.goals.duplicate);
  return {
    mutate: (goalId: string, options?: any) => {
      duplicate({ id: goalId as Id<"goals"> })
        .then(res => options?.onSuccess?.(res))
        .catch(err => options?.onError?.(err));
    }
  };
};

// Deprecated or need to implement in Convex
export const useOnboardingPlan = () => {
  // This was using an API endpoint. For now, just return a dummy mutation
  // or implement the AI logic via Convex Action later.
  return {
    mutate: (data: any, options?: { onSuccess?: (data: any) => void; onError?: (err: any) => void }) => {
      console.warn("useOnboardingPlan not implemented in Convex yet");
      // For now, return an error to the caller
      options?.onError?.(new Error("Onboarding plan generation not yet implemented"));
    }
  };
};
