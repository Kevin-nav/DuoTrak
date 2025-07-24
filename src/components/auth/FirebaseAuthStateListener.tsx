'use client';

import { useEffect, useState, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';
import { handleAuthSuccess } from '@/lib/auth-flow';
import { getRedirectResult, User as FirebaseUser } from 'firebase/auth';
import { persistentLog } from '@/lib/logger';
import { useEffectOnce } from '@/hooks/useEffectOnce';

export default function FirebaseAuthStateListener() {
  const { refetchUserDetails, clearUserDetails } = useUser();
  const isInitialAuthCheck = useRef(true);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  // This effect handles the result of a redirect sign-in attempt.
  // It should only run once on the initial load of the application.
  useEffectOnce(() => {
    const processRedirectResult = async () => {
      try {
        persistentLog('Checking for Firebase redirect result...');
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          persistentLog('Firebase redirect result found.', { uid: result.user.uid });
          await handleAuthSuccess(result.user, null, refetchUserDetails, result.user.displayName || undefined);
        } else {
          persistentLog('No new Firebase redirect result found.');
        }
      } catch (error) {
        console.error('Error processing Firebase redirect result:', error);
        persistentLog('!!! Error processing Firebase redirect result !!!', { error });
      } finally {
        setIsProcessingRedirect(false);
      }
    };

    processRedirectResult();
  });

  // This effect listens for auth state changes.
  useEffect(() => {
    if (isProcessingRedirect) return;

    const unsubscribe = auth.onAuthStateChanged((user: FirebaseUser | null) => {
      // We want to ignore the VERY FIRST check on load, because the UserProvider
      // is already handling the initial session check. This listener should
      // only react to subsequent, real-time changes (e.g., user logs out in another tab).
      if (isInitialAuthCheck.current) {
        isInitialAuthCheck.current = false;
        persistentLog('Auth Listener: Ignoring initial auth state check.');
        return;
      }

      persistentLog('Auth Listener: Auth state changed.', { hasUser: !!user });
      if (user) {
        // A user has logged in *after* the initial load.
        refetchUserDetails();
      } else {
        // The user has logged out.
        clearUserDetails();
      }
    });

    return () => unsubscribe();
  }, [isProcessingRedirect, refetchUserDetails, clearUserDetails]);

  return null; // This component does not render anything.
}
