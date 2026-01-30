'use client';

import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import FullPageSpinner from '@/components/ui/FullPageSpinner';
import GoalDetailView from '@/components/goal-detail-view';
import { useGoal } from '@/hooks/useGoals';

const GoalDetailPage = () => {
  const params = useParams();
  const goalId = params.goalId as string;

  const { data: goal, isLoading, isError } = useGoal(goalId);

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
          Error loading goal.
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

