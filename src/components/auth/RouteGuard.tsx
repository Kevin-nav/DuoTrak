'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter, usePathname } from 'next/navigation';
import FullPageSpinner from '@/components/ui/FullPageSpinner';
import { persistentLog } from '@/lib/logger';

/**
 * A client-side component that protects routes based on the user's account status.
 * It ensures a user is authenticated and directs them to the correct part of the
 * application based on their progress (onboarding, partnership, or active).
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { userDetails, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    persistentLog('RouteGuard: Running check...', {
      isLoading,
      pathname,
      accountStatus: userDetails?.account_status,
    });

    // Don't do anything until the user's status is confirmed.
    if (isLoading) {
      persistentLog('RouteGuard: Auth state is loading. Waiting...');
      return;
    }

    // If no user details, middleware is already handling the redirect to /login.
    if (!userDetails) {
      persistentLog('RouteGuard: No user details. Middleware should be redirecting.');
      return;
    }

    const { account_status } = userDetails;

    // --- State-Based Routing ---
    
    // 1. User needs to complete onboarding
    const isAlreadyOnboarding = pathname.startsWith('/onboarding');
    if (account_status === 'AWAITING_ONBOARDING' && !isAlreadyOnboarding) {
      persistentLog('RouteGuard: Status is AWAITING_ONBOARDING. Redirecting to /onboarding.');
      router.push('/onboarding');
      return;
    }

    // 2. User needs to find a partner
    const isAlreadyOnInvitePage = pathname.startsWith('/invite-partner');
    if (account_status === 'AWAITING_PARTNERSHIP' && !isAlreadyOnInvitePage) {
      persistentLog('RouteGuard: Status is AWAITING_PARTNERSHIP. Redirecting to /invite-partner.');
      router.push('/invite-partner');
      return;
    }

    // 3. User is active but is trying to access onboarding/invite pages
    const isProtectedAppRoute = !isAlreadyOnboarding && !isAlreadyOnInvitePage;
    if (account_status === 'ACTIVE' && !isProtectedAppRoute) {
        persistentLog('RouteGuard: Status is ACTIVE but user is on a setup page. Redirecting to /dashboard.');
        router.push('/dashboard');
        return;
    }

  }, [userDetails, isLoading, router, pathname]);

  // --- Render Logic ---

  // While loading, or if userDetails are not yet available, show a spinner.
  if (isLoading || !userDetails) {
    return <FullPageSpinner />;
  }

  // If a redirect is imminent, show a spinner to prevent content flashing.
  const isRedirecting = 
    (userDetails.account_status === 'AWAITING_ONBOARDING' && !pathname.startsWith('/onboarding')) ||
    (userDetails.account_status === 'AWAITING_PARTNERSHIP' && !pathname.startsWith('/invite-partner'));

  if (isRedirecting) {
    return <FullPageSpinner />;
  }

  // If all checks pass, render the protected page content.
  persistentLog('RouteGuard: All checks passed. Rendering content.');
  return <>{children}</>;
}