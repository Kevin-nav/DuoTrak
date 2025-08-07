'use client';

import { useUser } from '@/contexts/UserContext';
import AccountSettings from '@/components/account-settings';
import FullPageSpinner from '@/components/ui/FullPageSpinner';
import DashboardLayout from '@/components/dashboard-layout';

export default function ProfilePage() {
  const { userDetails, isLoading } = useUser();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!userDetails) {
    // This case should ideally be handled by the RouteGuard,
    // but as a fallback, we can show a message or redirect.
    // For now, we'll also show a spinner while the redirect happens.
    return <FullPageSpinner />;
  }

  return (
    <DashboardLayout>
      <AccountSettings user={userDetails} />
    </DashboardLayout>
  );
}
