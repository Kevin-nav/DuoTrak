'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import FullPageSpinner from '@/components/ui/FullPageSpinner';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { userDetails, isLoading, logoutCompleteTimestamp } = useUser();
  const router = useRouter();
  const [isWaitingForLogout, setIsWaitingForLogout] = useState(true);

  useEffect(() => {
    const logoutTimestampStr = sessionStorage.getItem('logout-timestamp');

    if (logoutTimestampStr) {
      const logoutTimestamp = parseInt(logoutTimestampStr, 10);
      
      // If the logout in the context is not yet complete (or hasn't happened),
      // and that logout was initiated *after* the context was last updated, we wait.
      if (!logoutCompleteTimestamp || logoutCompleteTimestamp < logoutTimestamp) {
        setIsWaitingForLogout(true);
      } else {
        // The context has confirmed the logout is complete. We can stop waiting
        // and remove the flag.
        sessionStorage.removeItem('logout-timestamp');
        setIsWaitingForLogout(false);
      }
    } else {
      // If there's no logout timestamp, we are not in a logout flow.
      setIsWaitingForLogout(false);
    }
  }, [logoutCompleteTimestamp]);


  useEffect(() => {
    // Do not perform any redirects while we are actively waiting for a logout to complete.
    if (isWaitingForLogout) {
      return;
    }

    // Standard logic: If loading is finished and userDetails are present, redirect.
    if (!isLoading && userDetails) {
      router.push('/dashboard');
    }
  }, [userDetails, isLoading, router, isWaitingForLogout]);

  // Show a spinner if the app is loading, if we are waiting for a logout to
  // complete, or if userDetails are present (and a redirect is imminent).
  if (isLoading || isWaitingForLogout || userDetails) {
    return <FullPageSpinner />;
  }

  // If not loading and no user, show the actual login/signup page content.
  return <>{children}</>;
}