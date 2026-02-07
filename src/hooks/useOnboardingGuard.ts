'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export function useOnboardingGuard() {
    const { userDetails, isLoading } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading || !userDetails) return;

        const { account_status } = userDetails;

        // Route based on status
        switch (account_status) {
            case 'AWAITING_ONBOARDING':
                // User needs to invite a partner
                if (!pathname.startsWith('/invite-partner')) {
                    router.replace('/invite-partner');
                }
                break;

            case 'AWAITING_PARTNERSHIP':
                // User has invited someone, waiting for them (or waiting for acceptance)
                // If they are on the inviter setup flow, let them stay
                // If they are on the pending page, let them stay
                if (!pathname.startsWith('/onboarding/inviter') && !pathname.startsWith('/invite-partner/pending')) {
                    // Default to inviter onboarding flow if they aren't there
                    router.replace('/onboarding/inviter');
                }
                break;

            case 'ONBOARDING_PARTNERED':
                // Partnership formed, now setting up goals
                // Should be allowed in onboarding pages
                if (!pathname.startsWith('/onboarding')) {
                    // If trying to go elsewhere, maybe redirect to start of onboarding?
                    // But valid onboarding pages include /onboarding/start, /onboarding, etc.
                    // We'll trust the user's navigation within /onboarding, but force them there if elsewhere
                    // CONTEXT: The main onboarding flow is likely /onboarding or /onboarding/start
                    if (!pathname.startsWith('/onboarding') && pathname !== '/dashboard') {
                        router.replace('/onboarding');
                    }
                }
                break;

            case 'ACTIVE':
                // Fully active, should be in dashboard
                if (pathname.startsWith('/onboarding') || pathname.startsWith('/invite-partner')) {
                    router.replace('/dashboard');
                }
                break;
        }
    }, [userDetails, isLoading, pathname, router]);

    return { isLoading, userDetails };
}
