'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';

const SESSION_COOKIE_NAME = '__session';
const MASTER_ACCESS_COOKIE_NAME = '__master_access';

export type AccountStatus = 'AWAITING_ONBOARDING' | 'AWAITING_PARTNERSHIP' | 'ONBOARDING_PARTNERED' | 'ACTIVE';
export type PartnershipStatus = 'active' | 'pending' | 'no_partner';

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
    partnership_status: PartnershipStatus;
    partner_full_name: string | null;
    // Invitation fields
    sent_invitation: any | null;
    received_invitation: any | null;
    // Badge fields
    badges: any[];
}

interface UserContextType {
    userDetails: UserDetails | null | undefined;
    isLoading: boolean;
    isMockMode: boolean;
    isMasterAccess: boolean;
    signOut: () => Promise<void>;
    refetchUserDetails: () => Promise<void>;
    sendInvitation: (email: string, name: string, customMessage?: string) => Promise<void>;
    withdrawInvitation: (invitationId: string) => Promise<void>;
    nudgePartner: (invitationId: string) => Promise<void>;
    partnerDisplayName: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Generates mock user details based on the specified account status
 */
function generateMockUserDetails(accountStatus: AccountStatus): UserDetails {
    const baseUser: UserDetails = {
        id: 'mock-user-id',
        firebase_uid: 'mock-firebase-uid',
        email: 'mock@example.com',
        full_name: 'Mock User',
        bio: 'This is a mock user profile for development.',
        timezone: 'UTC',
        profile_picture_url: 'https://via.placeholder.com/150',
        account_status: accountStatus,
        notifications_enabled: true,
        current_streak: 5,
        longest_streak: 10,
        total_tasks_completed: 20,
        goals_conquered: 3,
        partner_id: null,
        partnership_id: null,
        partnership_status: 'no_partner',
        partner_full_name: null,
        partner_nickname: null,
        sent_invitation: null,
        received_invitation: null,
        badges: [],
    };

    // Customize based on account status
    switch (accountStatus) {
        case 'AWAITING_ONBOARDING':
            // New user, no partner yet
            break;

        case 'AWAITING_PARTNERSHIP':
            // User has sent an invitation
            baseUser.sent_invitation = {
                id: 'mock-invitation-id',
                recipient_email: 'partner@example.com',
                recipient_name: 'Potential Partner',
                status: 'pending',
                sent_at: new Date().toISOString(),
            };
            baseUser.partnership_status = 'pending';
            break;

        case 'ONBOARDING_PARTNERED':
            // User is partnered but still in onboarding
            baseUser.partner_id = 'mock-partner-id';
            baseUser.partnership_id = 'mock-partnership-id';
            baseUser.partnership_status = 'active';
            baseUser.partner_full_name = 'Mock Partner';
            baseUser.partner_nickname = 'Mocky';
            break;

        case 'ACTIVE':
            // Fully active user with partner
            baseUser.partner_id = 'mock-partner-id';
            baseUser.partnership_id = 'mock-partnership-id';
            baseUser.partnership_status = 'active';
            baseUser.partner_full_name = 'Mock Partner';
            baseUser.partner_nickname = 'Mocky';
            baseUser.current_streak = 15;
            baseUser.longest_streak = 30;
            baseUser.total_tasks_completed = 100;
            baseUser.goals_conquered = 10;
            baseUser.badges = [
                { id: '1', name: 'Early Bird', icon: '🌅' },
                { id: '2', name: 'Streak Master', icon: '🔥' },
            ];
            break;
    }

    return baseUser;
}

/**
 * Checks if master access is active
 */
function checkMasterAccess(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check for master access cookie
    const cookies = document.cookie.split(';');
    const hasMasterCookie = cookies.some(cookie => 
        cookie.trim().startsWith(`${MASTER_ACCESS_COOKIE_NAME}=`)
    );
    
    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const hasMasterQuery = urlParams.has('master_key');
    
    return hasMasterCookie || hasMasterQuery;
}

/**
 * Generates mock user details for master access
 */
function generateMasterUserDetails(): UserDetails {
    return {
        id: 'master-user-id',
        firebase_uid: 'master-firebase-uid',
        email: 'master@system.local',
        full_name: '🔐 Master Access User',
        bio: 'Unrestricted system access for development and debugging.',
        timezone: 'UTC',
        profile_picture_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzY2NjciLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn5OBPC90ZXh0Pjwvc3ZnPg==',
        account_status: 'ACTIVE',
        notifications_enabled: true,
        current_streak: 999,
        longest_streak: 999,
        total_tasks_completed: 999,
        goals_conquered: 999,
        partner_id: 'master-partner-id',
        partnership_id: 'master-partnership-id',
        partnership_status: 'active',
        partner_full_name: 'System Partner',
        partner_nickname: 'Sys',
        sent_invitation: null,
        received_invitation: null,
        badges: [
            { id: 'master-1', name: 'Master Access', icon: '🔐' },
            { id: 'master-2', name: 'System Admin', icon: '👑' },
            { id: 'master-3', name: 'Debug Mode', icon: '🐛' },
        ],
    };
}

/**
 * Checks if mock mode is active based on environment and headers
 */
function checkMockMode(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check environment variables
    const mockAuthEnabled = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
    const mockAuthBypassEnabled = process.env.NEXT_PUBLIC_MOCK_AUTH_BYPASS === 'true';
    
    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const hasMockQuery = urlParams.get('mock-auth') === 'true';
    
    return mockAuthEnabled && mockAuthBypassEnabled && hasMockQuery;
}

/**
 * Fetches user details from the backend
 */
const fetchUser = async (): Promise<UserDetails | null> => {
    console.log('[UserContext] Fetching user details...');
    
    try {
        const data = await apiClient.getCurrentUser();
        
        // Defensively trim email whitespace
        if (data && data.email) {
            data.email = data.email.trim();
        }
        
        console.log('[UserContext] User details fetched successfully');
        return data;
    } catch (error) {
        console.log('[UserContext] User not authenticated or fetch failed');
        return null;
    }
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const queryClient = useQueryClient();
    const [isMasterAccess, setIsMasterAccess] = useState(false);
    const [isMockMode, setIsMockMode] = useState(false);
    const [mockAccountStatus, setMockAccountStatus] = useState<AccountStatus>('ACTIVE');

    useEffect(() => {
        // Check for master access first (highest priority)
        const masterAccess = checkMasterAccess();
        setIsMasterAccess(masterAccess);
        
        if (masterAccess) {
            console.warn('[MASTER ACCESS] 🔐 Unrestricted access active');
            return;
        }
        
        // Check if we're in mock mode
        const mockMode = checkMockMode();
        setIsMockMode(mockMode);
        
        if (mockMode) {
            // Get the mock account status from environment or default
            const status = (process.env.NEXT_PUBLIC_MOCK_ACCOUNT_STATUS || 'ACTIVE') as AccountStatus;
            setMockAccountStatus(status);
            console.warn(`[MOCK AUTH] Mock mode active with status: ${status}`);
        }
    }, []);

    // Use conditional query based on access mode
    const { data: userDetails, isLoading, refetch } = useQuery({
        queryKey: ['user', 'me', isMasterAccess ? 'master' : (isMockMode ? 'mock' : 'real')],
        queryFn: () => {
            if (isMasterAccess) {
                return Promise.resolve(generateMasterUserDetails());
            }
            if (isMockMode) {
                return Promise.resolve(generateMockUserDetails(mockAccountStatus));
            }
            return fetchUser();
        },
        enabled: true,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const signOut = async () => {
        if (isMasterAccess) {
            console.log('[MASTER ACCESS] Revoking master access...');
            // Clear master access cookie
            document.cookie = `${MASTER_ACCESS_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            // Remove query parameter and redirect
            const url = new URL(window.location.href);
            url.searchParams.delete('master_key');
            url.pathname = '/login';
            window.location.href = url.toString();
            return;
        }

        if (isMockMode) {
            console.log('[MOCK AUTH] Mock sign out - clearing query param and reloading');
            const url = new URL(window.location.href);
            url.searchParams.delete('mock-auth');
            url.pathname = '/login';
            window.location.href = url.toString();
            return;
        }

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
            }

            // Step 3: Clear All Local User Data
            queryClient.clear();

            // Step 4: Redirect to Login with a full page reload
            window.location.href = '/login';

        } catch (error) {
            console.error("Backend logout failed. Aborting sign-out.", error);
            toast.error("Logout failed. Please check your connection and try again.");
            queryClient.clear();
            window.location.href = '/login';
        }
    };

    const refetchUserDetails = async () => {
        if (isMasterAccess || isMockMode) {
            console.log('[SPECIAL ACCESS] Refetch - no-op in special access mode');
            return;
        }
        await refetch();
    };

    const sendInvitation = async (email: string, name: string, customMessage?: string) => {
        if (isMasterAccess) {
            console.log('[MASTER ACCESS] sendInvitation:', { email, name, customMessage });
            toast.success("(Master Access) Operation simulated successfully!");
            return;
        }

        if (isMockMode) {
            console.log('[MOCK AUTH] Mock sendInvitation:', { email, name, customMessage });
            toast.success("(Mock) Invitation sent successfully!");
            setMockAccountStatus('AWAITING_PARTNERSHIP');
            await refetch();
            return;
        }

        try {
            await apiClient.sendInvitation(email, name, customMessage);
            toast.success("Invitation sent successfully!");
            await refetchUserDetails();
        } catch (error: any) {
            toast.error(error.message || "Failed to send invitation.");
            throw error;
        }
    };

    const withdrawInvitation = async (invitationId: string) => {
        if (isMasterAccess) {
            console.log('[MASTER ACCESS] withdrawInvitation:', { invitationId });
            toast.success("(Master Access) Operation simulated successfully!");
            return;
        }

        if (isMockMode) {
            console.log('[MOCK AUTH] Mock withdrawInvitation:', { invitationId });
            toast.success("(Mock) Invitation withdrawn successfully!");
            
            // Update mock user to remove invitation
            setMockAccountStatus('AWAITING_ONBOARDING');
            await refetch();
            return;
        }

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
        if (isMasterAccess) {
            console.log('[MASTER ACCESS] nudgePartner:', { invitationId });
            toast.success("(Master Access) Operation simulated successfully!");
            return;
        }

        if (isMockMode) {
            console.log('[MOCK AUTH] Mock nudgePartner:', { invitationId });
            toast.success("(Mock) Nudge sent successfully!");
            return;
        }

        try {
            await apiClient.nudgePartner(invitationId);
            toast.success("Nudge sent successfully!");
            await refetchUserDetails();
        } catch (error: any) {
            toast.error(error.message || "Failed to send nudge.");
            throw error;
        }
    };

    const partnerDisplayName = userDetails?.partner_nickname || userDetails?.partner_full_name || 'Your Partner';

    return (
        <UserContext.Provider 
            value={{ 
                userDetails, 
                isLoading: isLoading && !isMasterAccess && !isMockMode, 
                isMockMode,
                isMasterAccess,
                signOut, 
                refetchUserDetails, 
                sendInvitation, 
                withdrawInvitation, 
                nudgePartner,
                partnerDisplayName,
            }}
        >
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
