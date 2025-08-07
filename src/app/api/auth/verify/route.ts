// src/app/api/auth/verify/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = '__session';

export async function GET(request: NextRequest) {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: 'No session cookie found.' }, { status: 401 });
  }

  try {
    // Proxy the verification request to the FastAPI backend
    const backendUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/v1/auth/verify-session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward the session cookie to the backend
        'Cookie': `${SESSION_COOKIE_NAME}=${sessionCookie}`,
        'X-Internal-Request': 'middleware-verification'
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'Session verification failed.', detail: errorData.detail },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error in verify proxy:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
