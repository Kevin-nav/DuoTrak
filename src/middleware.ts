// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// --- Constants ---
const SESSION_COOKIE_NAME = '__session';
const MASTER_ACCESS_COOKIE_NAME = '__master_access';
const MASTER_ACCESS_HEADER = 'X-Master-Access-Key';

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
const INVITER_SETUP_ROUTE = '/onboarding/inviter';
const INVITE_PARTNER_ROUTE = '/invite-partner';
const PENDING_INVITE_ROUTE = '/invite-partner/pending';
const DASHBOARD_ROUTE = '/dashboard';

// --- Type Definitions ---
type AccountStatus = 'AWAITING_ONBOARDING' | 'AWAITING_PARTNERSHIP' | 'ONBOARDING_PARTNERED' | 'ACTIVE';

interface MiddlewareStatusResponse {
  account_status: AccountStatus;
  has_pending_invitation: boolean;
}

// --- Master Access Functions ---

/**
 * Generates a cryptographically secure master key
 * Run this once in a Node.js environment to generate your key:
 * node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
function generateMasterKey(): string {
  // This function is for documentation/generation purposes, not run in middleware
  return ""; // Placeholder, as actual generation is external
}

/**
 * Validates the master access key using Web Crypto API for timing-safe comparison
 */
async function validateMasterKey(providedKey: string, secretKey: string): Promise<boolean> {
  if (!providedKey || !secretKey) return false;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const providedHmac = await crypto.subtle.sign(
      'HMAC',
      key,
      enc.encode(providedKey)
    );

    const secretHmac = await crypto.subtle.sign(
      'HMAC',
      key,
      enc.encode(secretKey)
    );

    // Manual timing-safe comparison
    const a = new Uint8Array(providedHmac);
    const b = new Uint8Array(secretHmac);
    if (a.length !== b.length) {
      return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  } catch (e) {
    console.error('[MASTER ACCESS] Web Crypto validation failed:', e);
    return false;
  }
}

/**
 * Checks if master access is enabled for this request
 */
async function checkMasterAccess(request: NextRequest): Promise<boolean> {
  console.log('[MASTER ACCESS DEBUG] Starting checkMasterAccess...');
  const masterAccessEnabled = process.env.ENABLE_MASTER_ACCESS === 'true';
  console.log(`[MASTER ACCESS DEBUG] ENABLE_MASTER_ACCESS: ${process.env.ENABLE_MASTER_ACCESS} (parsed: ${masterAccessEnabled})`);
  if (!masterAccessEnabled) {
    console.log('[MASTER ACCESS DEBUG] Master access not enabled via env var.');
    return false;
  }

  const masterSecretKey = process.env.MASTER_ACCESS_KEY;
  console.log(`[MASTER ACCESS DEBUG] MASTER_ACCESS_KEY present: ${!!masterSecretKey}`);
  if (!masterSecretKey) {
    console.error('[MASTER ACCESS] MASTER_ACCESS_KEY not configured in environment');
    return false;
  }

  const cookieKey = request.cookies.get(MASTER_ACCESS_COOKIE_NAME)?.value;
  console.log(`[MASTER ACCESS DEBUG] Cookie key present: ${!!cookieKey}`);
  if (cookieKey && await validateMasterKey(cookieKey, masterSecretKey)) {
    console.log('[MASTER ACCESS DEBUG] Validated via cookie.');
    return true;
  }

  const headerKey = request.headers.get(MASTER_ACCESS_HEADER);
  console.log(`[MASTER ACCESS DEBUG] Header key present: ${!!headerKey}`);
  if (headerKey && await validateMasterKey(headerKey, masterSecretKey)) {
    console.log('[MASTER ACCESS DEBUG] Validated via header.');
    return true;
  }

  const urlKey = request.nextUrl.searchParams.get('master_key');
  console.log(`[MASTER ACCESS DEBUG] URL key present: ${!!urlKey}`);
  if (urlKey && await validateMasterKey(urlKey, masterSecretKey)) {
    console.log('[MASTER ACCESS DEBUG] Validated via URL parameter.');
    return true;
  }

  console.log('[MASTER ACCESS DEBUG] No valid master key found.');
  return false;
}

/**
 * Creates a response with master access indicators
 */
function createMasterAccessResponse(request: NextRequest, response: NextResponse): NextResponse {
  const masterKey = request.nextUrl.searchParams.get('master_key') ||
    request.headers.get(MASTER_ACCESS_HEADER);

  const isPersistentByDefault = process.env.MASTER_ACCESS_PERSISTENT_BY_DEFAULT !== 'false';

  // Set cookie for persistent master access (expires in 24 hours) ONLY if isPersistentByDefault is true
  if (masterKey && !request.cookies.has(MASTER_ACCESS_COOKIE_NAME) && isPersistentByDefault) {
    response.cookies.set({
      name: MASTER_ACCESS_COOKIE_NAME,
      value: masterKey,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      path: '/',
    });
  }

  // Set response headers to indicate master access
  response.headers.set('X-Master-Access-Active', 'true');
  response.headers.set('X-Master-Access-Level', 'unrestricted');

  return response;
}

// --- Helper Functions ---

/**
 * Checks if mock authentication is enabled for development
 */
function isMockAuthEnabled(request: NextRequest): boolean {
  // Only enable in development
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_IN_PRODUCTION !== 'true') {
    return false;
  }

  const mockAuthEnabled = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
  const mockAuthBypassEnabled = process.env.NEXT_PUBLIC_MOCK_AUTH_BYPASS === 'true';

  // Option 1: Check for custom header (can be set via browser extension)
  const hasMockHeader = request.headers.get('X-Mock-Auth-Bypass') === 'true';

  // Option 2: Check for query parameter (easier for development)
  const hasMockQuery = request.nextUrl.searchParams.get('mock-auth') === 'true';

  return mockAuthEnabled && mockAuthBypassEnabled && (hasMockHeader || hasMockQuery);
}

/**
 * Gets the mock status based on environment variables
 */
function getMockStatus(): MiddlewareStatusResponse {
  const mockAccountStatus = (process.env.NEXT_PUBLIC_MOCK_ACCOUNT_STATUS || 'ACTIVE') as AccountStatus;

  return {
    account_status: mockAccountStatus,
    has_pending_invitation: mockAccountStatus === 'AWAITING_PARTNERSHIP',
  };
}

/**
 * Since we've moved to Convex, we no longer call the FastAPI backend 
 * from middleware. Session validation happens client-side via Firebase Auth
 * and Convex's ConvexProviderWithAuth.
 * 
 * This function now just returns a "pass-through" status when a session cookie exists.
 * Detailed routing based on account_status will be handled client-side.
 */
async function fetchUserStatus(sessionCookie: string): Promise<MiddlewareStatusResponse | null> {
  // If we have a session cookie, assume the user is authenticated.
  // Detailed validation happens client-side via Firebase Auth + Convex.
  // Return ACTIVE status to allow access to protected routes.
  // The frontend will handle proper routing based on actual Convex user data.
  if (sessionCookie) {
    return {
      account_status: 'ACTIVE',
      has_pending_invitation: false,
    };
  }
  return null;
}

/**
 * Determines the redirect URL based on the user's account status
 */
function getRedirectForStatus(
  status: MiddlewareStatusResponse,
  pathname: string,
  request: NextRequest
): NextResponse | null {
  // If user is on auth pages but is already authenticated, redirect to dashboard
  if (AUTH_REDIRECT_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL(DASHBOARD_ROUTE, request.url));
  }

  switch (status.account_status) {
    case 'AWAITING_ONBOARDING':
      // Force user to the invite page if they have not yet sent an invitation
      if (pathname !== INVITE_PARTNER_ROUTE) {
        return NextResponse.redirect(new URL(INVITE_PARTNER_ROUTE, request.url));
      }
      break;

    case 'AWAITING_PARTNERSHIP':
      // If the user has sent an invitation, they must complete their own setup
      if (status.has_pending_invitation) {
        // Allow access to the setup page and the final pending page
        if (pathname !== INVITER_SETUP_ROUTE && pathname !== PENDING_INVITE_ROUTE) {
          return NextResponse.redirect(new URL(INVITER_SETUP_ROUTE, request.url));
        }
      } else {
        // If they haven't sent an invite yet, force them to the invite page
        if (pathname !== INVITE_PARTNER_ROUTE) {
          return NextResponse.redirect(new URL(INVITE_PARTNER_ROUTE, request.url));
        }
      }
      break;

    case 'ONBOARDING_PARTNERED':
      // For partnered users in onboarding, allow them to access onboarding routes
      // but redirect from invite pages to dashboard
      if (pathname === INVITE_PARTNER_ROUTE || pathname === PENDING_INVITE_ROUTE) {
        return NextResponse.redirect(new URL(DASHBOARD_ROUTE, request.url));
      }
      break;

    case 'ACTIVE':
      // If an active user tries to access onboarding or invite pages, redirect to dashboard
      if (pathname === ONBOARDING_ROUTE ||
        pathname === INVITER_SETUP_ROUTE ||
        pathname === INVITE_PARTNER_ROUTE ||
        pathname === PENDING_INVITE_ROUTE) {
        return NextResponse.redirect(new URL(DASHBOARD_ROUTE, request.url));
      }
      break;

    default:
      // Fallback for any unknown status: redirect to login
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
  }

  return null;
}

// --- Main Middleware Logic ---

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js specific paths and static files to pass through
  if (pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Allow all API routes to pass through; they have their own auth checks
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // --- Check for Master Access (Highest Priority) ---
  if (await checkMasterAccess(request)) {
    console.warn(`[MASTER ACCESS] Unrestricted access granted for ${pathname}`);

    // Create response with master access indicators
    let response = NextResponse.next();
    response = createMasterAccessResponse(request, response);

    // Log access for audit purposes
    const timestamp = new Date().toISOString();
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    console.warn(`[MASTER ACCESS AUDIT] ${timestamp} | Path: ${pathname} | UA: ${userAgent}`);

    // No restrictions - allow access to any page
    return response;
  }

  // --- Check for Mock Auth (Development Only) ---
  if (isMockAuthEnabled(request)) {
    console.warn(`[MOCK AUTH] Active for ${pathname}`);

    const mockStatus = getMockStatus();

    // Create a response with mock auth indicator
    const response = NextResponse.next();

    // Set a header that client-side code can check to confirm mock mode
    response.headers.set('X-Mock-Auth-Active', 'true');
    response.headers.set('X-Mock-Account-Status', mockStatus.account_status);

    // In mock mode, we still apply routing rules based on the mock status
    // but we don't check for actual authentication
    const redirect = getRedirectForStatus(mockStatus, pathname, request);

    if (redirect) {
      console.warn(`[MOCK AUTH] Redirecting from ${pathname} to ${redirect.headers.get('Location')}`);
      return redirect;
    }

    console.warn(`[MOCK AUTH] Allowing access to ${pathname}`);
    return response;
  }

  // --- Production/Normal Authentication Flow ---

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Unauthenticated User Logic
  if (!sessionCookie) {
    // If trying to access protected route, redirect to login
    if (!PUBLIC_ROUTES.includes(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    // Allow access to public routes
    return NextResponse.next();
  }

  // Authenticated User Logic
  const status = await fetchUserStatus(sessionCookie);

  // If we couldn't fetch the status, treat as unauthenticated
  if (!status) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.cookies.delete(SESSION_COOKIE_NAME);
    return redirectResponse;
  }

  // Apply routing rules based on actual status
  const redirect = getRedirectForStatus(status, pathname, request);

  if (redirect) {
    return redirect;
  }

  // Allow the request to proceed
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