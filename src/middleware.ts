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
];

// Routes that an authenticated user should NOT be able to access
const AUTH_REDIRECT_ROUTES = ['/login', '/signup'];

// Core application routes
const ONBOARDING_ROUTE = '/onboarding';
const INVITER_SETUP_ROUTE = '/onboarding/setup';
const INVITE_PARTNER_ROUTE = '/invite-partner';
const PENDING_INVITE_ROUTE = '/invite-partner/pending';
const DASHBOARD_ROUTE = '/dashboard';

// --- Type Definitions ---
type AccountStatus = 'AWAITING_ONBOARDING' | 'AWAITING_PARTNERSHIP' | 'ACTIVE';

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

  // Handle the invitation acceptance page separately
  if (pathname.startsWith('/invite/')) {
    return NextResponse.next();
  }

  // --- Unauthenticated User Logic ---
  if (!sessionCookie) {
    // If trying to access a protected route, redirect to login
    if (!PUBLIC_ROUTES.includes(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    // Otherwise, allow access to public routes
    return NextResponse.next();
  }

  // --- Authenticated User Logic ---
  
  // The backend URL must be read from an environment variable.
  // The middleware runs on the server, so it has access to server-side variables.
  const backendUrl = process.env.FASTAPI_URL;
  if (!backendUrl) {
    // If the backend URL is not configured, we cannot proceed.
    // This is a critical configuration error.
    console.error("FATAL: FASTAPI_URL environment variable is not set.");
    // In a real scenario, you might want to return a 500 error page.
    // For now, we'll redirect to login to prevent an infinite loop.
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Fetch the user's real-time status from our new backend endpoint
  const statusApiUrl = `${backendUrl}/api/v1/users/me/status`;
  const response = await fetch(statusApiUrl, {
    headers: {
      'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}`,
    },
  });

  // If the session is invalid (e.g., expired token), the API will return 401
  if (!response.ok) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);
    // Clear the invalid cookie
    redirectResponse.cookies.delete(SESSION_COOKIE_NAME);
    return redirectResponse;
  }

  const status: MiddlewareStatusResponse = await response.json();

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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
