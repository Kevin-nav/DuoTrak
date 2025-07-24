'use client';

import React, { createContext, useContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useQueryClient } from '@tanstack/react-query';
import { handleAuthSuccess } from '@/lib/auth-flow';
import { persistentLog } from '@/lib/logger';
import { apiFetch } from '@/lib/api/core'; // Import apiFetch to trigger CSRF fetch

// ... (interface definitions remain the same)
export interface UserDetails { // (Interface details omitted for brevity) 
    id: string;
    email: string;
    full_name: string | null;
    onboarding_complete: boolean;
    partnership_status: string;
    // ... other fields
}

interface UserContextType {
    firebaseUser: FirebaseUser | null;
    userDetails: UserDetails | null;
    isLoading: boolean;
    isAuthenticating: boolean; // New: separate loading state for auth flow
    pendingRedirect: string | null; // New: track pending redirects
    setPendingRedirect: (url: string | null) => void;
    logoutCompleteTimestamp: number | null; // New: To signal logout completion
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
    const [logoutCompleteTimestamp, setLogoutCompleteTimestamp] = useState<number | null>(null); // New state
    const router = useRouter();
    const queryClient = useQueryClient();

    // Effect to pre-fetch the CSRF token on initial load
    useEffect(() => {
        const initializeSession = async () => {
            try {
                // This call will automatically handle fetching and setting the CSRF token
                // because of the logic we added in api/core.ts.
                await apiFetch('/api/v1/auth/csrf', { method: 'GET' });
                persistentLog('CSRF token pre-fetched successfully.');
            } catch (error) {
                persistentLog('Failed to pre-fetch CSRF token.', { error });
            }
        };
        initializeSession();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            persistentLog('onAuthStateChanged: Fired', { hasUser: !!user });
            setFirebaseUser(user);
            
            if (user) {
                setIsAuthenticating(true);
                try {
                    persistentLog('onAuthStateChanged: User found, syncing with backend...');
                    const details = await handleAuthSuccess(user);
                    setUserDetails(details);
                    queryClient.setQueryData(['userDetails'], details); // Also update react-query cache
                    persistentLog('onAuthStateChanged: Sync successful.');

                    // Handle pending redirect AFTER state is set
                    if (pendingRedirect) {
                        const redirectUrl = pendingRedirect;
                        persistentLog('onAuthStateChanged: Executing pending redirect', { redirectUrl });
                        setPendingRedirect(null); // Clear the redirect state
                        // Use setTimeout to ensure state updates are processed before navigation
                        setTimeout(() => {
                            router.push(redirectUrl);
                        }, 100);
                    }
                } catch (error) {
                    persistentLog('onAuthStateChanged: Auth sync error', { error });
                    setUserDetails(null);
                    queryClient.setQueryData(['userDetails'], null);
                    setPendingRedirect(null); // Auth failed, clear any pending redirect
                    await signOut(auth); // Sign out from firebase to be safe
                } finally {
                    persistentLog('onAuthStateChanged: Authentication process finished.');
                    setIsAuthenticating(false);
                }
            } else {
                // No user, clear everything
                persistentLog('onAuthStateChanged: No user found, clearing session.');
                setUserDetails(null);
                queryClient.setQueryData(['userDetails'], null);
                setPendingRedirect(null);
                setIsAuthenticating(false);
                setLogoutCompleteTimestamp(Date.now()); // New: Set timestamp on logout
            }
            
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [pendingRedirect, router, queryClient]);

    return (
        <UserContext.Provider value={{
            firebaseUser,
            userDetails,
            isLoading,
            isAuthenticating,
            pendingRedirect,
            setPendingRedirect,
            logoutCompleteTimestamp, // New: Provide timestamp to consumers
        }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
