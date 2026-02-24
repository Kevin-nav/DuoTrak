'use client';

import { useUser } from '@/contexts/UserContext';
import ProfileContent from '@/components/profile-content';
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
    <div data-theme="warm-beige" className="profile-beige-scope min-h-full">
      <DashboardLayout>
        <ProfileContent />
      </DashboardLayout>
    </div>
  );
}
