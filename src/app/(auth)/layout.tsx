'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import FullPageSpinner from '@/components/ui/FullPageSpinner';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { userDetails, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and userDetails are present, redirect to dashboard.
    if (!isLoading && userDetails) {
      router.push('/dashboard');
    }
  }, [userDetails, isLoading, router]);

  // Show a spinner if the app is loading or if userDetails are present (redirect is imminent).
  if (isLoading || userDetails) {
    return <FullPageSpinner />;
  }

  // If not loading and no user, show the actual login/signup page content.
  return <>{children}</>;
}