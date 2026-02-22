'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import FullPageSpinner from '@/components/ui/FullPageSpinner';
import { persistentLog } from '@/lib/logger';

/**
 * A client-side component that protects routes by ensuring user data is loaded.
 * It does NOT handle redirection. Redirection is the sole responsibility of the middleware.
 * Its only job is to show a loading state while the user session is being verified.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { userDetails, isLoading, isMockMode, isMasterAccess } = useUser();

  React.useEffect(() => {
    if (!isLoading && !userDetails && !isMockMode && !isMasterAccess) {
      router.replace('/login');
    }
  }, [isLoading, userDetails, isMockMode, isMasterAccess, router]);

  // In master access mode, we can immediately render the children as the middleware
  // has already handled routing and the UserContext will provide master data.
  if (isMasterAccess) {
    persistentLog('RouteGuard: Master access is active. Rendering children immediately.');
    return <>{children}</>;
  }

  // In mock mode, we can immediately render the children as the middleware
  // has already handled routing and the UserContext will provide mock data.
  if (isMockMode) {
    persistentLog('RouteGuard: Mock mode is active. Rendering children immediately.');
    return <>{children}</>;
  }

  // While the useQuery in UserContext is fetching the user's session state,
  // or if the middleware is about to perform a redirect (in which case userDetails will be null),
  // show a loading spinner.
  if (isLoading) {
    persistentLog('RouteGuard: isLoading, showing spinner.');
    return <FullPageSpinner />;
  }

  if (!userDetails) {
    persistentLog('RouteGuard: no userDetails after loading; redirecting to /login.');
    return <FullPageSpinner />;
  }

  // If loading is complete and user details are present, the user is authenticated.
  // The middleware has already ensured they are on the correct page.
  persistentLog('RouteGuard: All checks passed. Rendering content.');
  return <>{children}</>;
}
