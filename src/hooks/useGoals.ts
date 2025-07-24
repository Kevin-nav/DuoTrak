// src/hooks/useGoals.ts
import { useQuery } from '@tanstack/react-query';
import { getGoals } from '@/lib/api/goals';

export const useGoals = () => {
  return useQuery({
    queryKey: ['goals'],
    queryFn: getGoals,
  });
};
