'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter, usePathname } from 'next/navigation';
import FullPageSpinner from '@/components/ui/FullPageSpinner';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { userDetails, isLoading, isAuthenticating, setPendingRedirect } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if not loading, not authenticating, and no user details
    if (!isLoading && !isAuthenticating && !userDetails) {
      setPendingRedirect(pathname); // Store intended path
      router.push('/login'); // Redirect to login
    }
  }, [userDetails, isLoading, isAuthenticating, pathname, router, setPendingRedirect]);

  // Show loading while determining auth state or if authentication is in progress
  if (isLoading || isAuthenticating) {
    return <FullPageSpinner />;
  }

  // If no user details after loading, assume redirect to login is in progress
  if (!userDetails) {
    return <FullPageSpinner />;
  }

  // User is authenticated, render protected content
  return <>{children}</>;
}