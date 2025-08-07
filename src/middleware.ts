import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers'; // Import the new async cookies store
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = '__session';
// This secret key must be the same as the one used in your FastAPI backend.
// It should be stored in an environment variable.
const JWT_SECRET = new TextEncoder().encode(process.env.SECRET_KEY || 'your-secret-key');

// Define route configurations
const ROUTE_CONFIG = {
  // Routes that don't require authentication
  public: ['/', '/login', '/signup', '/api/auth/csrf-token'],
  // Routes that authenticated users should be redirected away from
  authRedirect: ['/login', '/signup'],
  // API routes that need different handling
  api: {
    public: ['/api/auth/csrf-token', '/api/health', '/api/auth/verify'],
    protected: ['/api/user', '/api/dashboard']
  }
} as const;

// ... (ROUTE_CONFIG and helper functions remain the same)

async function verifySession(sessionCookie: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(sessionCookie, JWT_SECRET);
    // You can add additional checks here, e.g., check payload.type === 'session'
    return payload.uid != null;
  } catch (error) {
    console.error('[Middleware] JWT Verification Error:', error);
    return false;
  }
}

// ... (The rest of the middleware function)
// The call to verifySession will need to be updated to remove the `request` argument.
// Example: const isValid = await verifySession(sessionCookie);


function isPublicRoute(pathname: string): boolean {
  return ROUTE_CONFIG.public.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

function shouldRedirectAuthenticated(pathname: string): boolean {
  return ROUTE_CONFIG.authRedirect.includes(pathname);
}

function isPublicApiRoute(pathname: string): boolean {
  return ROUTE_CONFIG.api.public.some(route => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.nextUrl.origin;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Use the new async cookies() store
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  // Handle API routes differently
  if (pathname.startsWith('/api/')) {
    if (isPublicApiRoute(pathname)) {
      return NextResponse.next();
    }
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    const isValid = await verifySession(sessionCookie);
    if (!isValid) {
      const response = NextResponse.json(
        { error: 'Invalid session' }, 
        { status: 401 }
      );
      // Use the async cookieStore to delete the cookie
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
    
    return NextResponse.next();
  }

  // Handle page routes
  if (sessionCookie) {
    const isValid = await verifySession(sessionCookie);
    
    if (isValid) {
      // User is authenticated
      if (shouldRedirectAuthenticated(pathname)) {
        console.log(`[Middleware] Authenticated user accessing ${pathname}, redirecting to dashboard`);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } else {
      // Invalid session cookie
      console.log(`[Middleware] Invalid session cookie, clearing and redirecting to login`);
      const response = NextResponse.redirect(new URL('/login', request.url));
      // Use the async cookieStore to delete the cookie
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
  } else {
    // No session cookie
    if (!isPublicRoute(pathname)) {
      console.log(`[Middleware] Unauthenticated access to ${pathname}, redirecting to login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};