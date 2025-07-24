'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import FullPageSpinner from '@/components/ui/FullPageSpinner';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      // Set a timestamp in sessionStorage. This is the "before" signal.
      // It tells the AuthLayout that a logout has been initiated.
      sessionStorage.setItem('logout-timestamp', Date.now().toString());

      try {
        // 1. Tell the backend to clear its session cookie.
        await apiFetch('/api/v1/auth/logout', { method: 'POST' });
        
        // 2. Sign out from Firebase on the client. This will trigger the
        // onAuthStateChanged listener in UserContext, which sets the "after" signal.
        await signOut(auth);
        
        // 3. Navigate to the login page using the client-side router.
        // The AuthLayout will now handle waiting for the state to be correct.
        toast.success("You have been successfully logged out.");
        router.push('/login');

      } catch (error) {
        console.error("Logout failed", error);
        toast.error("An error occurred during logout. Please try again.");
        // If logout fails, send the user to the login page anyway as a fallback.
        router.push('/login');
      }
    };

    handleLogout();
  }, [router]);

  return (
    <FullPageSpinner message="Logging you out..." />
  );
}
