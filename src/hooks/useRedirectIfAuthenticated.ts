'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

/**
 * A hook to redirect the user if they are already authenticated.
 * This is useful for pages like login, signup, etc., that should not be accessible to logged-in users.
 * @param redirectPath The path to redirect to if the user is authenticated.
 */
export const useRedirectIfAuthenticated = (redirectPath: string) => {
  const { userDetails, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything until the auth state is confirmed.
    if (isLoading) {
      return;
    }

    // If loading is complete and we have user details, it means the user is logged in.
    if (userDetails) {
      router.push(redirectPath);
    }
  }, [userDetails, isLoading, router, redirectPath]);
};
