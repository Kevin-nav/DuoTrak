# DuoTrak Authentication System: Analysis and Proposed Solution

## 1. Executive Summary

*   **Project:** DuoTrak, a full-stack application with a Next.js frontend and a Python (FastAPI) backend.
*   **Problem Statement:** After a user successfully authenticates via the login form, the browser is not persisting the session cookie sent by the server. This prevents the user from accessing authenticated routes (like `/profile`), which remain stuck in an indefinite loading state. This issue is currently blocking all development on authenticated features.
*   **Deployment Context:** The frontend is targeted for deployment on Vercel. The backend is targeted for deployment on Google Cloud Run. Any proposed solution must be architecturally sound for this decoupled, serverless, cross-origin production environment.
*   **Request:** This document outlines the current system, the evidence of the failure, the investigation so far, and a final proposed solution. We are seeking an unbiased, expert opinion on this proposal before implementation.

## 2. Current Authentication Flow (As-Is)

The intended authentication flow is designed to use a secure, `HttpOnly` session cookie.

1.  **Client-Side Login:** The user submits their credentials to the Firebase Client SDK.
2.  **Token Exchange:** Upon a successful Firebase login, the client receives a Firebase ID Token. This token is sent to a Next.js API route at `/api/auth/login`.
3.  **Server-Side Session Creation:** The Next.js server verifies the Firebase ID Token and creates a long-lived DuoTrak session cookie (`__session`).
4.  **Cookie Response:** The server sends the `__session` cookie back to the browser in a `Set-Cookie` header.
5.  **Authenticated State:** The browser is expected to store this cookie and automatically send it with all subsequent requests to the backend, authenticating the user.

### Code Excerpts (Current Implementation)

**`src/app/api/auth/login/route.ts` (Server-Side Session Creation)**
```typescript
// ... (Firebase token verification) ...
const response = NextResponse.json({ user: userDetails });

// The server attempts to send the cookie to the browser here.
response.cookies.set({
  name: SESSION_COOKIE_NAME,
  value: sessionCookie,
  maxAge: COOKIE_MAX_AGE,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});

return response;
```

**`src/lib/api/core.ts` (Client-Side API Call)**
```typescript
// ...
const newOptions: RequestInit = {
  ...options,
  headers,
  // This 'credentials: include' flag is set to instruct the browser
  // to handle cross-origin cookies.
  credentials: 'include',
};

const response = await fetch(url, newOptions);
// ...
```

**`backend/app/main.py` (FastAPI CORS Configuration)**
```python
# The backend is configured to allow requests from the frontend's origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 3. The Issue: The "Stuck Spinner" and the Missing Cookie

The primary symptom is that any authenticated page (e.g., `/profile`) gets stuck on a loading spinner indefinitely. Our investigation has revealed that this is caused by the browser failing to set the session cookie.

### Hard Evidence (Browser Log)

The following log is from the `UserContext` immediately after the application loads. It is undeniable proof that the cookie is not present in the browser.

**`errors/error1.txt` (Browser Console)**
```
[UserContext] useEffect: Checking for session cookie. Found: false
```

### Hard Evidence (Server Log)

The following log from the `/api/auth/login` endpoint proves that the server is correctly configured and is sending a perfectly formed `Set-Cookie` header to the browser.

**`errors/error1.txt` (Terminal Log)**
```
[LOGIN] DIAGNOSTIC: process.env.NODE_ENV = "development". Cookie 'secure' flag will be: false
[LOGIN] DIAGNOSTIC: Final response headers being sent: Headers {
  'content-type': 'application/json',
  'set-cookie': '__session=...; Path=/; Expires=...; Max-Age=...; HttpOnly; SameSite=lax, ...'
}
```

## 4. The Investigation: A History of Attempts

We have rigorously investigated several potential causes, and the evidence has ruled them out.

*   **Attempt 1: Incorrect `NODE_ENV`:** We hypothesized that the `secure` flag was being incorrectly set to `true` in development. The server log above **disproves** this; the `secure` flag is correctly `false`.
*   **Attempt 2: Firebase Admin SDK Initialization:** We hypothesized that the server-side SDK was misconfigured. The server log `✅ [Firebase Admin] 8. SUCCESS: Initialized app for project: duotrak-6367d` **disproves** this; the SDK is perfectly initialized.
*   **Attempt 3: Missing `credentials: 'include'`:** We hypothesized that the client-side `fetch` call was missing the flag to handle cookies. The code excerpt in section 2 **disproves** this; the flag is present.

## 5. The Root Cause Diagnosis: Third-Party Cookie Rejection

The only remaining hypothesis that fits all the evidence is that the browser is silently rejecting the cookie due to its third-party cookie privacy policies.

*   **The Conflict:** In our local development environment, the Next.js frontend runs on `http://localhost:3000` and the FastAPI backend runs on `http://127.0.0.1:8000`. From the browser's perspective, these are **different origins**.
*   **The Rejection:** When the frontend code at `localhost` makes a direct API call to `127.0.0.1`, the browser sees this as a cross-site request. When the backend at `127.0.0.1` tries to set a cookie, the browser correctly identifies this as a "third-party cookie" and blocks it as a security and privacy measure.

This explains why the server logs are perfect but the browser state is wrong.

## 6. The Proposed Solution: A Production-Ready Local Proxy

To solve this, we propose to stop making direct cross-origin calls from the client and instead use Next.js's built-in `rewrites` feature to proxy API requests. This will make both the frontend and backend appear to be on the **same origin** (`localhost:3000`) to the browser, turning the third-party cookie into a first-party cookie, which the browser will accept.

This approach has the significant benefit of perfectly simulating our target production environment, where a single public domain will route traffic to either Vercel or Google Cloud Run based on the path.

### Proposed Action 1: Modify `next.config.mjs`

We will re-introduce the `rewrites` configuration to act as our local proxy.

**`next.config.mjs` (Proposed Change)**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // The destination is the actual URL of our FastAPI backend.
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ]
  },
};
```

### Proposed Action 2: Modify `src/lib/api/core.ts`

We will modify the `apiFetch` function to call the local, proxied path instead of the direct backend URL.

**`src/lib/api/core.ts` (Proposed Change)**
```javascript
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // All API calls will now be made to the Next.js server, which will proxy
  // them to the backend. This makes all requests same-origin.
  // The `url` parameter will now be a relative path like `/api/v1/auth/login`.
  const absoluteUrl = url; 

  // ... rest of the function remains the same
}
```

We believe this is the definitive, architecturally sound solution and seek your expert opinion before we proceed with implementation.