'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getGoalById } from '@/lib/api/goals';
import DashboardLayout from '@/components/dashboard-layout';
import FullPageSpinner from '@/components/ui/FullPageSpinner';
import { GoalRead } from '@/schemas/goal';
import GoalDetailView from '@/components/goal-detail-view';

const GoalDetailPage = () => {
  const params = useParams();
  const goalId = params.goalId as string;

  const { data: goal, isLoading, isError, error } = useQuery<GoalRead>({
    queryKey: ['goal', goalId],
    queryFn: () => getGoalById(goalId),
    enabled: !!goalId,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <FullPageSpinner />
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="text-red-500 p-4">
          Error loading goal: {error.message}
        </div>
      </DashboardLayout>
    );
  }

  if (!goal) {
    return (
      <DashboardLayout>
        <div className="p-4">Goal not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <GoalDetailView goal={goal} />
    </DashboardLayout>
  );
};

export default GoalDetailPage;
