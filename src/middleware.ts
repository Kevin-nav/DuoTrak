import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define a type for the user object we expect from our API
interface User {
  id: string;
  partnership_status: 'partnered' | 'no_partner';
  sent_invitation: object | null;
  received_invitation: object | null;
  // Add other user properties as needed
}

interface AuthData {
  isAuthenticated: boolean;
  user: User | null;
}

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/dashboard', '/invite-partner', '/pending-acceptance'];
  const publicRoutes = ['/login', '/signup', '/'];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.includes(pathname);

  // If user has a token and tries to access a public route (like /login),
  // redirect them to the dashboard.
  if (authToken && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user does NOT have a token and tries to access a protected route,
  // redirect them to the login page.
  if (!authToken && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // All other data-dependent redirection logic (e.g., based on partnership status)
  // should be handled on the client-side after user data is fetched.
  // The middleware's only job is to handle coarse-grained auth protection.


  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
