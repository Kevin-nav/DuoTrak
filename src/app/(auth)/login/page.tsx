'use client';

import { useUser } from '@/contexts/UserContext';
import LoginForm from '@/components/auth/LoginForm';
import FullPageSpinner from '@/components/ui/FullPageSpinner';

export default function LoginPage() {
  const { userDetails, isLoading } = useUser();
  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (userDetails) {
    return <FullPageSpinner />;
  }

  return <LoginForm />;
}
