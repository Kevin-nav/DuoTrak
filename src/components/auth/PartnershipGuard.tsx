
'use client';

import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { persistentLog } from '@/lib/logger';

// A simple loading spinner component to provide feedback to the user.
const FullPageSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-background-light">
    <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-primary-blue"></div>
  </div>
);

interface PartnershipGuardProps {
  children: React.ReactNode;
}

export function PartnershipGuard({ children }: PartnershipGuardProps) {
  const { userDetails, isLoading } = useUser();
  const router = useRouter();

  persistentLog('PartnershipGuard: Running', { isLoading, partnershipStatus: userDetails?.partnership_status });

  // The RouteGuard should already handle the main loading state.
  // However, it's good practice to be defensive.
  if (isLoading) {
    persistentLog('PartnershipGuard: Auth state is loading. Showing spinner.');
    return <FullPageSpinner />;
  }

  // If there are no user details, something is wrong, but we let RouteGuard handle it.
  // This guard only cares about partnership status.
  if (!userDetails) {
    persistentLog('PartnershipGuard: No user details found. RouteGuard should have handled this.');
    // We don't redirect here to avoid conflicting with RouteGuard.
    // Returning a spinner is a safe fallback.
    return <FullPageSpinner />;
  }

  const isPartnered = userDetails.partnership_status === 'active';
  const hasSentInvitation = !!userDetails.sent_invitation;

  // If the user is already partnered, they can access the content.
  if (isPartnered) {
    persistentLog('PartnershipGuard: User is partnered. Rendering content.');
    return <>{children}</>;
  }

  // If the user is not partnered, redirect them to the appropriate page.
  persistentLog('PartnershipGuard: User is not partnered. Redirecting.');
  if (hasSentInvitation) {
    router.push('/invite-partner/pending');
  } else {
    router.push('/invite-partner');
  }

  // Return a spinner to prevent content flashing during the redirect.
  return <FullPageSpinner />;
}
