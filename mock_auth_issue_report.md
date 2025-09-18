# Mock Authentication Issue Report

## 1. Problem Statement

We are attempting to implement a **secure, development-only mock authentication mechanism** for our Next.js frontend. The primary goal is to enable developers to preview specific frontend routes (e.g., onboarding flows, invite pages) directly, without needing to go through the full multi-step authentication and invitation process. This is crucial for efficient UI development and testing.

**Key Constraints:**
*   **Development-Only:** The mocking must *only* be active in a local development environment and must be completely disabled or stripped out in production builds.
*   **Security Paramount:** The solution must not introduce any vulnerabilities or compromise the integrity of the actual authentication system.
*   **Full Frontend Preview:** The mock should allow navigation to protected routes as if a user with a specific `account_status` (e.g., `ONBOARDING_PARTNERED`, `AWAITING_PARTNERSHIP`, `ACTIVE`) were genuinely logged in.

## 2. Current Authentication System Overview

Our application uses a hybrid authentication model:
*   **Frontend (Next.js):** Handles user sign-in/sign-up via Firebase SDK. Upon successful Firebase authentication, it sends the Firebase ID Token to the backend.
*   **Backend (FastAPI):** Verifies the Firebase ID Token using the Firebase Admin SDK, creates/syncs the user in its PostgreSQL database, and generates a secure, `HttpOnly` session cookie (`__session`) for session management.
*   **Next.js Middleware (`src/middleware.ts`):** This is a critical server-side component. It intercepts all page navigations, checks for the `__session` cookie, and makes a server-to-server call to the backend's `/api/v1/users/me/status` endpoint to determine the user's `account_status`. Based on this status, it enforces routing rules (e.g., redirects users to onboarding if their status is `AWAITING_ONBOARDING`).
*   **Client-side User Context (`src/contexts/UserContext.tsx`):** This React context fetches detailed user information (`/api/v1/users/me`) and provides it to client-side components.

The application uses HTTPS with self-signed certificates for local development (`mcert`).

## 3. Attempts and Challenges

### Attempt 1: Client-side `UserContext.tsx` Mocking

**Description:**
The initial approach involved modifying `src/contexts/UserContext.tsx` to conditionally provide mock `userDetails` based on `NEXT_PUBLIC_MOCK_AUTH` and `NEXT_PUBLIC_MOCK_ACCOUNT_STATUS` environment variables. When `NEXT_PUBLIC_MOCK_AUTH=true`, the `UserProvider` would return hardcoded mock user data and mock functions (e.g., `signOut`, `sendInvitation`) without making actual API calls.

**Why it didn't work:**
While the client-side components correctly received mock user data, the Next.js `middleware.ts` runs *before* any React components are rendered. The middleware was still attempting to:
1.  Check for a `__session` cookie (which doesn't exist in mock mode).
2.  If a cookie *were* present, it would try to fetch user status from the backend (`/api/v1/users/me/status`).
Since no valid session cookie was present (or the backend call failed without a real session), the middleware consistently redirected to `/login`, preventing access to the desired mock routes. The frontend would then render the login page, and if `NEXT_PUBLIC_MOCK_AUTH` was set, it would show the mock user details on the login page, but the intended onboarding/invite pages were never reached.

### Attempt 2: Middleware Bypass with Header (Current State)

**Description:**
To address the middleware redirection, a development-only bypass was introduced in `src/middleware.ts`. This bypass checks for two conditions:
1.  `NEXT_PUBLIC_MOCK_AUTH_BYPASS=true` environment variable (set in `.env.local`).
2.  `X-Mock-Auth-Bypass: true` custom request header (manually added via browser extension).

The intention was that if both conditions are met, the middleware would simply call `NextResponse.next()` and allow the request to proceed without any authentication checks or redirects.

**Why it still doesn't fully resolve the issue:**
The logs indicate that even with the bypass, the middleware is still causing redirects to `/login`. This suggests that the `NextResponse.next()` call within the bypass block is not effectively preventing the subsequent authentication logic in the middleware from executing, or there's a misunderstanding of how `NextResponse.next()` interacts with the rest of the middleware's flow. The middleware still attempts to fetch user status from the backend, which fails in a mock environment, leading to the `/login` redirect.

## 4. Current State of the Code

### `src/contexts/UserContext.tsx`

```typescript
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';

const SESSION_COOKIE_NAME = '__session';

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
    sendInvitation: (email: string, name: string, customMessage?: string) => Promise<void>;
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

    const isMockAuth = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
    const mockAccountStatus = process.env.NEXT_PUBLIC_MOCK_ACCOUNT_STATUS as AccountStatus || 'ACTIVE';

    if (isMockAuth) {
        console.warn('--- MOCK AUTH ENABLED --- Providing mock user details.');
        const mockUserDetails: UserDetails = {
            id: 'mock-user-id',
            firebase_uid: 'mock-firebase-uid',
            email: 'mock@example.com',
            full_name: 'Mock User',
            bio: 'This is a mock user profile.',
            timezone: 'UTC',
            profile_picture_url: null,
            account_status: mockAccountStatus,
            notifications_enabled: true,
            current_streak: 5,
            longest_streak: 10,
            total_tasks_completed: 20,
            goals_conquered: 3,
            partner_id: mockAccountStatus === 'ACTIVE' || mockAccountStatus === 'ONBOARDING_PARTNERED' ? 'mock-partner-id' : null,
            partnership_id: mockAccountStatus === 'ACTIVE' || mockAccountStatus === 'ONBOARDING_PARTNERED' ? 'mock-partnership-id' : null,
            partnership_status: mockAccountStatus === 'ACTIVE' ? 'active' : (mockAccountStatus === 'ONBOARDING_PARTNERED' ? 'pending' : 'no_partner'),
            partner_full_name: mockAccountStatus === 'ACTIVE' || mockAccountStatus === 'ONBOARDING_PARTNERED' ? 'Mock Partner' : null,
            sent_invitation: null,
            received_invitation: null,
            badges: [],
        };

        const mockFunctions = {
            signOut: async () => console.log('MOCK: signOut called'),
            refetchUserDetails: async () => console.log('MOCK: refetchUserDetails called'),
            sendInvitation: async (email, name, customMessage) => console.log('MOCK: sendInvitation called', { email, name, customMessage }),
            withdrawInvitation: async (invitationId) => console.log('MOCK: withdrawInvitation called', { invitationId }),
            nudgePartner: async (invitationId) => console.log('MOCK: nudgePartner called', { invitationId }),
        };

        return (
            <UserContext.Provider value={{ userDetails: mockUserDetails, isLoading: false, ...mockFunctions }}>
                {children}
            </UserContext.Provider>
        );
    }

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

    const sendInvitation = async (email: string, name: string, customMessage?: string) => {
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
```

### `src/middleware.ts`

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// --- Route Definitions ---
const SESSION_COOKIE_NAME = '__session';

// Publicly accessible pages
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/invite-acceptance',
];

// Routes that an authenticated user should NOT be able to access
const AUTH_REDIRECT_ROUTES = ['/login', '/signup'];

// Core application routes
const ONBOARDING_ROUTE = '/onboarding';
const INVITER_SETUP_ROUTE = '/onboarding/inviter'; // Corrected route name
const INVITE_PARTNER_ROUTE = '/invite-partner';
const PENDING_INVITE_ROUTE = '/invite-partner/pending';
const DASHBOARD_ROUTE = '/dashboard';

// --- Type Definitions ---
type AccountStatus = 'AWAITING_ONBOARDING' | 'AWAITING_PARTNERSHIP' | 'ONBOARDING_PARTNERED' | 'ACTIVE';

interface MiddlewareStatusResponse {
  account_status: AccountStatus;
  has_pending_invitation: boolean;
}

// --- Main Middleware Logic ---

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Allow Next.js specific paths and static files to pass through
  if (pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Allow all API routes to pass through; they have their own auth checks.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  let status: MiddlewareStatusResponse;

  // --- Development-only Mock Auth Bypass ---
  const isMockAuthBypassEnabled = process.env.NEXT_PUBLIC_MOCK_AUTH_BYPASS === 'true';
  const hasMockAuthBypassHeader = request.headers.has('X-Mock-Auth-Bypass');

  if (isMockAuthBypassEnabled && hasMockAuthBypassHeader) {
    console.warn('--- MOCK AUTH BYPASS ACTIVE --- Providing mock status for development.');
    const mockAccountStatus = (process.env.NEXT_PUBLIC_MOCK_ACCOUNT_STATUS || 'ACTIVE') as AccountStatus;
    status = {
      account_status: mockAccountStatus,
      has_pending_invitation: mockAccountStatus === 'AWAITING_PARTNERSHIP', // Assume true for inviter flow
    };
  } else {
    // --- Unauthenticated User Logic (Original) ---
    if (!sessionCookie) {
      if (!PUBLIC_ROUTES.includes(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    // --- Authenticated User Logic (Original) ---
    const backendUrl = process.env.FASTAPI_URL;
    if (!backendUrl) {
      console.error("FATAL: FASTAPI_URL environment variable is not set.");
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    const statusApiUrl = `${backendUrl}/api/v1/users/me/status`;
    const response = await fetch(statusApiUrl, {
      headers: {
        'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}`,
      },
    });

    if (!response.ok) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.cookies.delete(SESSION_COOKIE_NAME);
      return redirectResponse;
    }

    status = await response.json();
  }

  // --- State-Based Routing ---

  // If user is on a page like /login or /signup, redirect them to the dashboard
  if (AUTH_REDIRECT_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL(DASHBOARD_ROUTE, request.url));
  }

  switch (status.account_status) {
    case 'AWAITING_ONBOARDING':
      // Force user to the invite page if they have not yet sent an invitation.
      if (pathname !== INVITE_PARTNER_ROUTE) {
        return NextResponse.redirect(new URL(INVITE_PARTNER_ROUTE, request.url));
      }
      break;

    case 'AWAITING_PARTNERSHIP':
      // If the user has sent an invitation, they must complete their own setup.
      if (status.has_pending_invitation) {
        // Allow access to the setup page and the final pending page.
        if (pathname !== INVITER_SETUP_ROUTE && pathname !== PENDING_INVITE_ROUTE) {
          return NextResponse.redirect(new URL(INVITER_SETUP_ROUTE, request.url));
        }
      } else {
        // If they haven't sent an invite yet, force them to the invite page.
        if (pathname !== INVITE_PARTNER_ROUTE) {
          return NextResponse.redirect(new URL(INVITE_PARTNER_ROUTE, request.url));
        }
      }
      break;

    case 'ONBOARDING_PARTNERED':
    case 'ACTIVE':
      // If an active user tries to access onboarding or invite pages, redirect to dashboard.
      if (pathname === ONBOARDING_ROUTE || pathname === INVITER_SETUP_ROUTE || pathname === INVITE_PARTNER_ROUTE || pathname === PENDING_INVITE_ROUTE) {
        return NextResponse.redirect(new URL(DASHBOARD_ROUTE, request.url));
      }
      break;
      
    default:
      // Fallback for any unknown status: redirect to login
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// --- Matcher Configuration ---
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*),',
  ],
};
```

## 5. Desired Outcome

We need a robust and secure way to preview specific frontend routes (like `/onboarding/start`, `/onboarding/inviter`, `/invite-partner`) by mocking the user's authentication status and `account_status` *without* triggering real backend API calls or redirects, strictly for development purposes. The current implementation still results in redirects to `/login` despite the client-side mock and the middleware bypass attempt.

## 6. Request for Developer Input

Given the persistent redirection issue with the middleware, we need a more effective strategy to bypass or mock the authentication flow within `src/middleware.ts` when `NEXT_PUBLIC_MOCK_AUTH_BYPASS` is enabled.

Could you please review the provided code and the attempts made, and suggest the best way to implement a secure development-only mock authentication that allows direct access to specific frontend routes based on a mocked `account_status`? We need to ensure the middleware correctly processes the mock status and allows navigation without redirection to `/login`.

---
