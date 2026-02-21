import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useState } from 'react';
import { mapGoalFromConvex } from '../../packages/domain/src/goals';

export const useGoals = () => {
  const goals = useQuery(api.goals.list);

  // Transform data if loaded
  const data = goals ? goals.map(mapGoalFromConvex) : undefined;

  return {
    data,
    isLoading: goals === undefined,
    isError: false // Convex handles errors by throwing, boundary catches it, or undefined for loading
  };
};

export const useGoal = (goalId: string) => {
  const goal = useQuery(api.goals.get, goalId ? { id: goalId as Id<"goals"> } : "skip");

  const data = goal ? mapGoalFromConvex(goal) : undefined;

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

// Onboarding Plan Generation - Uses Convex Action to call FastAPI backend
export const useOnboardingPlan = () => {
  const generatePlan = useAction(api.onboarding.generatePlan);
  const [isPending, setIsPending] = useState(false);

  return {
    isPending,
    mutate: async (
      data: { goalTitle: string; goalDescription: string; contextualAnswers?: Record<string, string> },
      options?: { onSuccess?: (data: any) => void; onError?: (err: any) => void }
    ) => {
      setIsPending(true);
      try {
        console.log("[useOnboardingPlan] Generating plan for:", data.goalTitle);
        const result = await generatePlan({
          goalTitle: data.goalTitle,
          goalDescription: data.goalDescription,
          contextualAnswers: data.contextualAnswers,
        });
        console.log("[useOnboardingPlan] Plan generated successfully:", result);
        options?.onSuccess?.(result);
      } catch (error: any) {
        console.error("[useOnboardingPlan] Failed to generate plan:", error);
        options?.onError?.(error);
      } finally {
        setIsPending(false);
      }
    },
  };
};
