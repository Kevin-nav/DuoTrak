import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { persistentLog } from '../lib/logger';

interface ProtectionOptions {
    // If true, user must be authenticated.
    protected: boolean;
    // If true, user must have a partner to access.
    requiresPartner?: boolean;
    // If true, user must NOT have a partner to access.
    requiresNoPartner?: boolean;
    // Path to redirect to if checks fail.
    redirect_to?: string;
}

export const useProtectedRoute = (options: ProtectionOptions) => {
    const { userDetails, isLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        persistentLog('--- Running Protection Check ---', { options, pathname: window.location.pathname });

        // Don't do anything while we are still loading the user's state.
        if (isLoading) {
            persistentLog('Hook is waiting for user details to load.');
            return;
        }

        persistentLog('User details finished loading. Proceeding with checks.', { userDetails });

        // 1. Check if the route is protected and if the user is authenticated.
        if (options.protected && !userDetails) {
            persistentLog('FAIL: Route is protected, but user is not authenticated. Redirecting to /login.');
            router.push(options.redirect_to || '/login');
            return;
        }

        // If the user is authenticated, proceed with partnership checks.
        if (userDetails) {
            const hasPartner = userDetails.partnership_status === 'active';
            persistentLog('User is authenticated.', { hasPartner });

            // 2. Check if the route requires a partner.
            if (options.requiresPartner && !hasPartner) {
                persistentLog('FAIL: Route requires a partner, but user does not have one. Redirecting.', { redirectTo: '/invite-partner' });
                router.push('/invite-partner');
                return;
            }

            // 3. Check if the route requires the user to NOT have a partner.
            if (options.requiresNoPartner && hasPartner) {
                persistentLog('FAIL: Route requires NO partner, but user has one. Redirecting.', { redirectTo: '/dashboard' });
                router.push('/dashboard');
                return;
            }
        }

        persistentLog('--- Protection Check Passed ---');

    }, [userDetails, isLoading, router, options]);
};
