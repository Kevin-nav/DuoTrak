'use client';

import React from 'react';
import { useUser } from '@/contexts/UserContext';
import FullPageSpinner from '@/components/ui/FullPageSpinner';

/**
 * A client-side component that protects routes by ensuring user data is loaded.
 * It does NOT handle redirection. Redirection is the sole responsibility of the middleware.
 * Its only job is to show a loading state while the user session is being verified.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { userDetails, isLoading } = useUser();

  // While the useQuery in UserContext is fetching the user's session state,
  // show a loading spinner.
  if (isLoading) {
    return <FullPageSpinner />;
  }

  // If loading is complete but there are no user details, it means the middleware
  // has already initiated a redirect to the login page. We show a spinner
  // to prevent any flash of content while the redirect is in progress.
  if (!userDetails) {
    return <FullPageSpinner />;
  }

  // If loading is complete and user details are present, the user is authenticated.
  // Render the protected page content.
  return <>{children}</>;
}
