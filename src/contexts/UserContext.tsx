'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';

const SESSION_COOKIE_NAME = '__session';

export type AccountStatus = 'AWAITING_ONBOARDING' | 'AWAITING_PARTNERSHIP' | 'ACTIVE';

export interface UserDetails {
    id: string;
    firebase_uid: string;
    email: string;
    full_name: string | null;
    bio: string | null;
    timezone: string | null;
    profile_picture_url: string | null;
    account_status: AccountStatus;
    notifications_enabled: boolean | null;
    current_streak: number | null;
    longest_streak: number | null;
    total_tasks_completed: number | null;
    goals_conquered: number | null;
    // Partnership fields
    partner_id: string | null;
    partnership_id: string | null;
    partnership_status: 'active' | 'pending' | 'no_partner';
    partner_full_name: string | null;
    // Invitation fields
    sent_invitation: any | null; // Define more specific types if available
    received_invitation: any | null; // Define more specific types if available
    // Badge fields
    badges: any[]; // Can be an empty array
}

interface UserContextType {
    userDetails: UserDetails | null | undefined; // undefined on initial load, null if not authenticated
    isLoading: boolean;
    signOut: () => Promise<void>;
    refetchUserDetails: () => Promise<void>;
    sendInvitation: (email: string, name: string) => Promise<void>;
    withdrawInvitation: (invitationId: string) => Promise<void>;
    nudgePartner: (invitationId: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const fetchUser = async (): Promise<UserDetails | null> => {
  console.log('--- [UserContext] fetchUser called ---');
  try {
    // This endpoint now verifies our JWT session token
    const data = await apiClient.getCurrentUser();
        // Defensively trim email whitespace - this is the root cause of the bug
        if (data && data.email) {
            data.email = data.email.trim();
        }
        console.log('--- RAW USER DATA ---');
        console.log(JSON.stringify(data, null, 2));
        console.log('--- END RAW USER DATA ---');
        return data; // Return the user object directly
      } catch (error) {
        // This is an expected "error" for unauthenticated users, so we don't log it.
        return null;
      }
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const queryClient = useQueryClient();

    const { data: userDetails, isLoading, refetch } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: fetchUser,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const signOut = async () => {
        try {
            // Step 1: Terminate the Backend Session
            await apiClient.logout();
            toast.success("Successfully logged out from server.");

            // Step 2: Sign Out of Firebase
            try {
                const auth = getAuth();
                await firebaseSignOut(auth);
            } catch (error) {
                console.error("Firebase sign-out failed, but proceeding with client-side cleanup:", error);
                // Don't re-throw, as the main session is already terminated.
            }

            // Step 3: Clear All Local User Data
            queryClient.clear();

            // Step 4: Redirect to Login with a full page reload
            window.location.href = '/login';

        } catch (error) {
            console.error("Backend logout failed. Aborting sign-out.", error);
            toast.error("Logout failed. Please check your connection and try again.");
            // As a fallback, still attempt to clear local state and redirect
            queryClient.clear();
            window.location.href = '/login';
        }
    };

    const refetchUserDetails = async () => {
        await refetch();
    };

    const sendInvitation = async (email: string, name: string) => {
        try {
            await apiClient.sendInvitation(email, name);
            toast.success("Invitation sent successfully!");
            await refetchUserDetails();
        } catch (error: any) {
            toast.error(error.message || "Failed to send invitation.");
            throw error;
        }
    };

    const withdrawInvitation = async (invitationId: string) => {
        try {
            await apiClient.withdrawInvitation(invitationId);
            toast.success("Invitation withdrawn successfully!");
            await refetchUserDetails();
        } catch (error: any) {
            toast.error(error.message || "Failed to withdraw invitation.");
            throw error;
        }
    };

    const nudgePartner = async (invitationId: string) => {
        try {
            await apiClient.nudgePartner(invitationId);
            toast.success("Nudge sent successfully!");
            await refetchUserDetails();
        } catch (error: any) {
            toast.error(error.message || "Failed to send nudge.");
            throw error;
        }
    };

    return (
        <UserContext.Provider value={{ userDetails, isLoading, signOut, refetchUserDetails, sendInvitation, withdrawInvitation, nudgePartner }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};