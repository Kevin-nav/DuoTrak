// src/app/api/auth/login/route.ts

import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import crypto from 'crypto';

export const runtime = 'nodejs';

const SESSION_COOKIE_NAME = '__session';
const CSRF_COOKIE_NAME = 'csrf_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 5; // 5 days in seconds

export async function POST(request: NextRequest) {
  console.log('\n--- [POST /api/auth/login] ---');
  try {
    console.log('[LOGIN] 1. Reading ID token from request body...');
    const { idToken } = await request.json();

    if (!idToken) {
      console.log('[LOGIN] 2. ERROR: ID token is missing from request. Responding with 400.');
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }
    console.log('[LOGIN] 2. ID token received.');

    console.log('[LOGIN] 3. Creating session cookie with Firebase Admin SDK...');
    const expiresIn = COOKIE_MAX_AGE * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    console.log(`[LOGIN] 4. SUCCESS: Session cookie created. Starts with: "${sessionCookie.substring(0, 15)}..."`);

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log(`[LOGIN] 5. ID token verified. UID: ${decodedToken.uid}, Email: ${decodedToken.email}`);

    // User sync to Convex happens client-side via UserSync component
    console.log('[LOGIN] 6. Skipping FastAPI - user sync handled by Convex UserSync component.');

    // Build minimal user details from the verified token
    const userDetails = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || null,
    };

    const csrfToken = crypto.randomBytes(32).toString('hex');
    const response = NextResponse.json({ user: userDetails });
    console.log('[LOGIN] 8. Setting session and CSRF cookies in response.');

    // --- DIAGNOSTIC LOG ---
    const isProduction = process.env.NODE_ENV === 'production';
    console.log(`[LOGIN] DIAGNOSTIC: process.env.NODE_ENV = "${process.env.NODE_ENV}". Cookie 'secure' flag will be: ${isProduction}`);
    // --- END DIAGNOSTIC LOG ---

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });

    response.cookies.set({
      name: CSRF_COOKIE_NAME,
      value: csrfToken,
      maxAge: COOKIE_MAX_AGE,
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });

    console.log('[LOGIN] 9. Login flow complete. Sending response to client.');

    // --- DIAGNOSTIC LOG ---
    console.log('[LOGIN] DIAGNOSTIC: Final response headers being sent:', response.headers);
    // --- END DIAGNOSTIC LOG ---

    return response;

  } catch (error: any) {
    console.error('[LOGIN] UNHANDLED ERROR in login flow.', {
      errorMessage: error.message,
      errorCode: error.code,
      stack: error.stack,
    });
    if (error.code?.startsWith('auth/')) {
      return NextResponse.json({ error: 'Invalid Firebase token.', detail: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create session.', detail: error.message }, { status: 500 });
  }
}
