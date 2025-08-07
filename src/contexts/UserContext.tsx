'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

const SESSION_COOKIE_NAME = '__session';

export interface UserDetails {
    id: string;
    firebase_uid: string;
    email: string;
    full_name: string | null;
    bio: string | null;
    timezone: string;
    profile_picture_url: string | null;
    onboarding_complete: boolean;
    notifications_enabled: boolean;
    current_streak: number;
    longest_streak: number;
    total_tasks_completed: number;
    goals_conquered: number;
    // Partnership fields
    partner_id: string | null;
    partnership_id: string | null;
    partnership_status: 'active' | 'pending' | 'inactive' | 'not_partnered';
    partner_full_name: string | null;
    // Invitation fields
    sent_invitation: any | null; // Define more specific types if available
    received_invitation: any | null; // Define more specific types if available
    // Badge fields
    badges: any[]; // Define more specific types if available
}

interface UserContextType {
    userDetails: UserDetails | null | undefined; // undefined on initial load, null if not authenticated
    isLoading: boolean;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const fetchUser = async (): Promise<UserDetails | null> => {
  console.log('--- [UserContext] fetchUser called ---');
  try {
    // This endpoint now verifies our JWT session token
    const data = await apiClient.getCurrentUser();
        console.log('--- [UserContext] apiClient.getCurrentUser() returned:', data);
        return data; // Return the user object directly
      } catch (error) {
        if (error instanceof Error && error.message.includes('401')) {
          // This is an expected "error" for unauthenticated users, so we don't log it.
        } else {
          interceptConsoleError('--- [UserContext] Failed to fetch user:', error);
        }
        return null;
      }
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const queryClient = useQueryClient();

    const { data: userDetails, isLoading, isError, error } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: fetchUser,
    retry: false, // Do not retry failed requests
    refetchOnWindowFocus: false, // Optional: prevent refetching on window focus
  });

    const logout = async () => {
        try {
            await apiClient.logout();
            // The apiClient handles the redirect and cache clearing is done via window reload
            toast.success("You have been logged out.");
        } catch (error) {
            console.error("Logout failed:", error);
            toast.error("Logout failed. Please try again.");
            // As a fallback, force clear and redirect
            queryClient.clear();
            window.location.href = '/login';
        }
    };

    const refreshUser = async () => {
        await refetch();
    };

    return (
        <UserContext.Provider value={{ userDetails, isLoading, logout, refreshUser }}>
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