'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';
import { Id } from '../../convex/_generated/dataModel';

const SESSION_COOKIE_NAME = '__session';
const MASTER_ACCESS_COOKIE_NAME = '__master_access';

export type AccountStatus = 'AWAITING_ONBOARDING' | 'AWAITING_PARTNERSHIP' | 'ONBOARDING_PARTNERED' | 'ACTIVE';
export type PartnershipStatus = 'active' | 'pending' | 'no_partner';

export interface UserDetails {
    _id: Id<"users">;
    id: string; // Keeping for compatibility, same as _id
    firebase_uid: string;
    email: string;
    full_name: string | null;
    bio: string | null;
    timezone: string | null;
    profile_picture_url: string | null;
    account_status: string; // Convex returns string, we can cast to AccountStatus if needed
    notifications_enabled: boolean | null;
    current_streak: number | null;
    longest_streak: number | null;
    total_tasks_completed: number | null;
    goals_conquered: number | null;
    // Partnership fields
    partner_id: Id<"users"> | null;
    partnership_id: Id<"partnerships"> | null;
    partnership_status: string; // Cast to PartnershipStatus
    partner_full_name: string | null;
    partner_nickname: string | null;
    nickname: string | null;
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
    refetchUserDetails: () => Promise<void>; // No-op in Convex, kept for compat
    sendInvitation: (email: string, name: string, customMessage?: string) => Promise<{ invitation: { invitation_token: string } } | null>;
    withdrawInvitation: (invitationId: string) => Promise<void>;
    nudgePartner: (invitationId: string) => Promise<void>;
    partnerDisplayName: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

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

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [isMasterAccess, setIsMasterAccess] = useState(false);
    const [isMockMode, setIsMockMode] = useState(false);

    // Convex Mutations
    const sendInvitationMutation = useMutation(api.invitations.create);
    const withdrawInvitationMutation = useMutation(api.invitations.withdraw);
    const nudgePartnerMutation = useMutation(api.invitations.nudge);

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
            console.warn(`[MOCK AUTH] Mock mode active`);
        }
    }, []);

    // Fetch User Data via Convex
    const convexUser = useQuery(api.users.current);

    // Transform Convex data to match UserDetails interface if necessary
    // Currently api.users.current returns almost exactly what we need
    const userDetails: UserDetails | null | undefined = convexUser ? {
        ...convexUser,
        id: convexUser._id, // Map _id to id
        // Map undefined to null for nullable string fields
        full_name: convexUser.full_name ?? null,
        bio: convexUser.bio ?? null,
        timezone: convexUser.timezone ?? null,
        profile_picture_url: convexUser.profile_picture_url ?? null,
        partner_full_name: convexUser.partner_full_name ?? null,
        partner_nickname: convexUser.partner_nickname ?? null,
        nickname: convexUser.nickname ?? null,
        // Default missing fields
        notifications_enabled: convexUser.notifications_enabled ?? true,
        current_streak: convexUser.current_streak ?? 0,
        longest_streak: convexUser.longest_streak ?? 0,
        total_tasks_completed: convexUser.total_tasks_completed ?? 0,
        goals_conquered: convexUser.goals_conquered ?? 0,
        badges: convexUser.badges || [],
    } : (convexUser === null ? null : undefined); // null means loaded & not found (or not auth), undefined means loading

    const isLoading = convexUser === undefined;

    const signOut = async () => {
        if (isMasterAccess) {
            // ... keep master access logic ...
            document.cookie = `${MASTER_ACCESS_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            const url = new URL(window.location.href);
            url.searchParams.delete('master_key');
            url.pathname = '/login';
            window.location.href = url.toString();
            return;
        }

        try {
            const auth = getAuth();
            await firebaseSignOut(auth);
            // Convex will automatically react to the auth state change
            window.location.href = '/login';
        } catch (error) {
            console.error("Logout failed", error);
            toast.error("Logout failed. Please try again.");
        }
    };

    const refetchUserDetails = async () => {
        // No-op for Convex, it's real-time
        console.log("refetchUserDetails called, but Convex is real-time.");
    };

    const sendInvitation = async (email: string, name: string, customMessage?: string): Promise<{ invitation: { invitation_token: string } } | null> => {
        try {
            const result = await sendInvitationMutation({ email, name, message: customMessage });
            toast.success("Invitation sent successfully!");
            return { invitation: { invitation_token: result.invitation_token } };
        } catch (error: any) {
            toast.error(error.message || "Failed to send invitation.");
            throw error;
        }
    };

    const withdrawInvitation = async (invitationId: string) => {
        try {
            await withdrawInvitationMutation({ invitationId: invitationId as Id<"partner_invitations"> });
            toast.success("Invitation withdrawn successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to withdraw invitation.");
            throw error;
        }
    };

    const nudgePartner = async (invitationId: string) => {
        try {
            await nudgePartnerMutation({ invitationId: invitationId as Id<"partner_invitations"> });
            toast.success("Nudge sent successfully!");
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
