// src/app/api/auth/logout/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

const SESSION_COOKIE_NAME = '__session';
const CSRF_COOKIE_NAME = 'csrf_token';

export async function POST(request: NextRequest) {
  console.log('\n--- [POST /api/auth/logout] ---');
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  try {
    if (sessionCookie) {
      console.log(`[Logout] 1. Session cookie found. Attempting to revoke Firebase session...`);
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie).catch(() => null);
      if (decodedClaims) {
        await adminAuth.revokeRefreshTokens(decodedClaims.uid);
        console.log(`[Logout] 2. SUCCESS: Firebase session revoked for UID: ${decodedClaims.uid}`);
      } else {
        console.log('[Logout] 2. WARNING: Could not decode session cookie. It may have already expired.');
      }
    } else {
      console.log('[Logout] 1. No session cookie found. Proceeding to clear cookies.');
    }
  } catch (error) {
    console.error('[Logout] 2. ERROR: Failed to revoke Firebase session, but proceeding with logout.', error);
  } finally {
    console.log('[Logout] 3. Entering `finally` block to guarantee cookie deletion.');
    const response = NextResponse.json({ success: true, message: "Logged out successfully." });
    
    console.log('[Logout] 4. Deleting session and CSRF cookies from browser.');
    response.cookies.delete(SESSION_COOKIE_NAME);
    response.cookies.delete(CSRF_COOKIE_NAME);
    
    console.log('[Logout] 5. Logout flow complete. Sending response.');
    return response;
  }
}
