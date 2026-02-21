import { cookies } from 'next/headers';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getSessionCookieName } from '@/lib/auth';

interface CurrentUser extends DecodedIdToken {
  has_partner?: boolean;
}

// This function now calls our internal API route to securely get user data
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const sessionCookieName = getSessionCookieName();
  const sessionCookie = cookieStore.get(sessionCookieName)?.value;

  if (!sessionCookie) {
    return null;
  }

  // On the server, we need the absolute URL. We construct it from environment
  // variables, with a fallback for local development.
  const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${host}/api/auth/verify-session`, {
      headers: {
        Cookie: `${sessionCookieName}=${sessionCookie}`,
      },
      // We use 'no-store' to ensure we always get the latest session status
      // and don't serve stale data from the cache.
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user as CurrentUser;
  } catch (error) {
    console.error('Error fetching user status in getCurrentUser:', error);
    return null;
  }
}
