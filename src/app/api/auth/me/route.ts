// src/app/api/auth/me/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { headers } from 'next/headers';

export const runtime = 'nodejs';

const SESSION_COOKIE_NAME = '__session';

export async function GET(request: NextRequest) {
  console.log('\n--- [GET /api/auth/me] ---');
  
  const headersList = headers();
  const cookieHeader = headersList.get('cookie');
  console.log(`[ME] 1. Received request. Full cookie header: "${cookieHeader || 'N/A'}"`);

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    console.log('[ME] 2. ERROR: No session cookie found in request. Responding with 401.');
    return NextResponse.json({ error: 'No session cookie found.' }, { status: 401 });
  }
  
  console.log(`[ME] 2. Found session cookie. Value starts with: "${sessionCookie.substring(0, 15)}..."`);
  console.log('[ME] 3. Attempting to verify cookie with Firebase Admin SDK...');

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    console.log(`[ME] 4. SUCCESS: Session verification successful. UID: ${decodedClaims.uid}. Responding with 200.`);
    return NextResponse.json({ user: decodedClaims }, { status: 200 });

  } catch (error: any) {
    console.error('[ME] 4. ERROR: Session verification failed. See details below.');
    console.error({
      errorMessage: error.message,
      errorCode: error.code,
      stack: error.stack,
    });
    console.log('[ME] Responding with 401.');
    return NextResponse.json({ error: 'Invalid session.', detail: error.message }, { status: 401 });
  }
}
