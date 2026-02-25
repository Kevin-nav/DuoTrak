'use client';

import React, { createContext, useContext, ReactNode, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';
import { Id } from '../../convex/_generated/dataModel';
import { identifyUser, trackEvent } from '@/lib/analytics/events';

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
    profile_picture_variants?: {
        original: string;
        xl: string;
        lg: string;
        md: string;
        sm: string;
    } | null;
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
    partner_profile_picture_url?: string | null;
    partner_email?: string | null;
    partner_bio?: string | null;
    partner_timezone?: string | null;
    partner_current_streak?: number | null;
    partner_longest_streak?: number | null;
    partner_total_tasks_completed?: number | null;
    partner_goals_conquered?: number | null;
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
    retryInviteEmail: (invitationId: string) => Promise<void>;
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
    const [lastTimezoneSynced, setLastTimezoneSynced] = useState<string | null>(null);
    const trackedProfileCreatedRef = useRef<string | null>(null);

    // Convex Mutations
    const updateUserMutation = useMutation(api.users.update);
    const sendInvitationMutation = useMutation(api.invitations.create);
    const withdrawInvitationMutation = useMutation(api.invitations.withdraw);
    const nudgePartnerMutation = useMutation(api.invitations.nudge);
    const retryInviteEmailMutation = useMutation(api.invitations.retryInviteEmail);

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
        profile_picture_variants: convexUser.profile_picture_variants ?? null,
        partner_full_name: convexUser.partner_full_name ?? null,
        partner_nickname: convexUser.partner_nickname ?? null,
        partner_profile_picture_url: convexUser.partner_profile_picture_url ?? null,
        partner_email: convexUser.partner_email ?? null,
        partner_bio: convexUser.partner_bio ?? null,
        partner_timezone: convexUser.partner_timezone ?? null,
        partner_current_streak: convexUser.partner_current_streak ?? 0,
        partner_longest_streak: convexUser.partner_longest_streak ?? 0,
        partner_total_tasks_completed: convexUser.partner_total_tasks_completed ?? 0,
        partner_goals_conquered: convexUser.partner_goals_conquered ?? 0,
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

    useEffect(() => {
        if (!userDetails || typeof window === "undefined") return;

        identifyUser(String(userDetails._id));
        if (trackedProfileCreatedRef.current !== String(userDetails._id)) {
            trackedProfileCreatedRef.current = String(userDetails._id);
            trackEvent("app_user_profile_created", {
                user_id: String(userDetails._id),
                auth_provider: "firebase",
            });
        }

        let detectedTimezone: string | null = null;
        try {
            detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
        } catch {
            detectedTimezone = null;
        }
        if (!detectedTimezone) return;

        if (lastTimezoneSynced === detectedTimezone) return;

        const storedTimezone = userDetails.timezone || "UTC";
        if (storedTimezone === detectedTimezone) {
            setLastTimezoneSynced(detectedTimezone);
            return;
        }

        updateUserMutation({ timezone: detectedTimezone })
            .then(() => {
                setLastTimezoneSynced(detectedTimezone);
            })
            .catch((error) => {
                console.error("Auto timezone sync failed:", error);
            });
    }, [userDetails, updateUserMutation, lastTimezoneSynced]);

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
            localStorage.removeItem('csrf_token');
            sessionStorage.removeItem('logout-timestamp');
            // Convex will automatically react to the auth state change.
            window.location.replace('/login');
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
            trackEvent("invite_action_taken", {
                action: "create",
                receiver_domain: email.split("@")[1] ?? "unknown",
            });
            toast.success("Invitation created. Email delivery is in progress.");
            return { invitation: { invitation_token: result.invitation_token } };
        } catch (error: any) {
            toast.error(error.message || "Failed to send invitation.");
            throw error;
        }
    };

    const withdrawInvitation = async (invitationId: string) => {
        try {
            await withdrawInvitationMutation({ invitationId: invitationId as Id<"partner_invitations"> });
            trackEvent("invite_action_taken", {
                action: "withdraw",
                invitation_id: invitationId,
            });
            toast.success("Invitation withdrawn successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to withdraw invitation.");
            throw error;
        }
    };

    const nudgePartner = async (invitationId: string) => {
        try {
            await nudgePartnerMutation({ invitationId: invitationId as Id<"partner_invitations"> });
            trackEvent("invite_action_taken", {
                action: "nudge",
                invitation_id: invitationId,
            });
            toast.success("Nudge sent successfully!");
        } catch (error: any) {
            toast.error(error.message || "Failed to send nudge.");
            throw error;
        }
    };

    const retryInviteEmail = async (invitationId: string) => {
        try {
            await retryInviteEmailMutation({ invitationId: invitationId as Id<"partner_invitations"> });
            trackEvent("invite_action_taken", {
                action: "retry_email",
                invitation_id: invitationId,
            });
            toast.success("Retry queued. We are attempting delivery again.");
        } catch (error: any) {
            toast.error(error.message || "Failed to retry invite email.");
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
                retryInviteEmail,
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
