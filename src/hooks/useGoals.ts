import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGoals, getGoalById, updateGoal, archiveGoal, duplicateGoal } from '@/lib/api/goals';
import { GoalUpdate } from '@/schemas/goal';

export const useGoals = () => {
  return useQuery({
    queryKey: ['goals'],
    queryFn: getGoals,
  });
};

export const useGoal = (goalId: string) => {
  return useQuery({
    queryKey: ['goals', goalId],
    queryFn: () => getGoalById(goalId),
    enabled: !!goalId,
  });
};

export const useUpdateGoal = (goalId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updatedGoal: GoalUpdate) => updateGoal(goalId, updatedGoal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};

export const useArchiveGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => archiveGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};

export const useDuplicateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => duplicateGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};

export const useOnboardingPlan = () => {
  return useMutation({
    mutationFn: (data: any) => getOnboardingPlan(data),
  });
};
