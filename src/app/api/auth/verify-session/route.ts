import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs'; // Or 'edge'

/**
 * This API route acts as a secure proxy to the backend.
 * It forwards the session cookie to the backend's /users/me endpoint
 * to get the full, up-to-date user profile, including partnership status.
 * This makes the backend the single source of truth for user data.
 */
export async function GET() {
  const sessionCookie = cookies().get('auth_token')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ isAuthenticated: false, user: null }, { status: 401 });
  }

  try {
    // Use the NEXT_PUBLIC_API_BASE_URL which is available server-side.
    // The proxy/rewrite in next.config.js is for client-side requests.
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    
    const response = await fetch(`${backendUrl}/api/v1/users/me`, {
      headers: {
        'Cookie': `auth_token=${sessionCookie}`
      }
    });

    if (!response.ok) {
      // If the backend returns an error (e.g., 401), the session is invalid.
      return NextResponse.json({ isAuthenticated: false, user: null }, { status: response.status });
    }

    const user = await response.json();
    
    // The session is valid, return the user data from the backend.
    return NextResponse.json({ isAuthenticated: true, user: user }, { status: 200 });

  } catch (error) {
    console.error('API route /api/auth/verify-session error:', error);
    return NextResponse.json(
      { isAuthenticated: false, user: null, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

