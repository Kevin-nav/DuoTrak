'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import FullPageSpinner from '@/components/ui/FullPageSpinner';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Firebase sign-out is the only logout authority in the new architecture.
        await signOut(auth);

        toast.success("You have been successfully logged out.");
        router.replace('/login');

      } catch (error) {
        console.error("Logout failed", error);
        toast.error("An error occurred during logout. Please try again.");
        router.replace('/login');
      }
    };

    handleLogout();
  }, [router]);

  return (
    <FullPageSpinner message="Logging you out..." />
  );
}
