'use client';

import React, { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import FullPageSpinner from '@/components/ui/FullPageSpinner'; // Assuming you have a FullPageSpinner component

export default function LoginPage() {
  const { userDetails, isLoading } = useUser();
  const router = useRouter();

  // Show loading while checking auth state
  if (isLoading) {
    return <FullPageSpinner />;
  }

  // If user is authenticated, don't show login form (will be redirected by useEffect)
  if (userDetails) {
    return <FullPageSpinner />;
  }

  return (
    <div>
      <h1>Login</h1>
      <LoginForm />
    </div>
  );
}
