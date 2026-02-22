import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth is handled client-side via Firebase + Convex.
// Middleware only skips static/API assets and otherwise passes through.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
