// src/lib/api/core.ts

import { toast } from 'sonner';

/**
 * Reads a cookie from the document.cookie string.
 * @param name The name of the cookie to read.
 * @returns The cookie value or an empty string if not found.
 */
function getCookie(name: string): string {
  if (typeof document === 'undefined') {
    return '';
  }
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || '';
  }
  return '';
}

/**
 * A global fetch wrapper that provides centralized logic for API calls.
 * 1. Automatically adds the CSRF token to unsafe requests.
 * 2. Automatically handles 401 Unauthorized errors by redirecting to the login page.
 *
 * @param url The URL to fetch.
 * @param options The options for the fetch request.
 * @returns The response from the fetch request.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // All API calls are now relative (e.g., /api/v1/users/me).
  // The Next.js server will proxy them to the FastAPI backend based on the
  // `rewrites` configuration in `next.config.mjs`.
  // This makes all requests same-origin from the browser's perspective.
  const absoluteUrl = url;

  console.log(`[apiFetch] Making same-origin request to: ${absoluteUrl}`);

  const headers = new Headers(options.headers || {});

  // Set default Content-Type for POST/PUT/PATCH requests if not already set
  if (['POST', 'PUT', 'PATCH'].includes(options.method?.toUpperCase() || '')) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  // Add CSRF token for unsafe methods
  if (options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
    const csrfToken = getCookie('csrf_token');
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    } else {
      console.warn('CSRF token not found. Making request without it.');
    }
  }

  const newOptions: RequestInit = {
    ...options,
    headers,
    // This is the crucial fix. It tells the browser to send cookies along with this request,
    // which is necessary for the server to know who is making the request. It also allows
    // the browser to accept the `Set-Cookie` header from the login response.
    credentials: 'include',
  };

  const response = await fetch(url, newOptions);

  // Graceful handling of session expiry
  if (response.status === 401) {
    toast.error('Your session has expired. Please log in again.');
    // Redirect to login page, clearing any query params
    window.location.href = '/login';
    // Return a mock response to prevent further processing by the caller
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return response;
}