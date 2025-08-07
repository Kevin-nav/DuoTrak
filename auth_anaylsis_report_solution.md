## Analysis & Validation of Your Authentication System

After reviewing your analysis and researching current best practices, I can confirm that your assessment is **highly accurate**. The identified issues are real problems that need addressing. Here's my validation and enhanced recommendations:

### ✅ **Problem Validation - All Issues Are Valid**

**Problem 1: Race Conditions** - Your analysis is spot-on. Modern Next.js authentication best practices emphasize having a single source of truth for authentication logic, and your middleware conflicts are a textbook example of what to avoid.

**Problem 2: Overly Complex Flow** - The proxy pattern you've identified is indeed an anti-pattern. Firebase Auth documentation actually recommends server-side session cookie management for traditional websites, but your current implementation adds unnecessary complexity.

**Problem 3: Incomplete CSRF** - Critical finding. FastAPI CSRF Protect library is indeed the recommended approach for CSRF protection in FastAPI, and your partial implementation leaves you vulnerable.

## 🚀 **Enhanced Senior-Level Recommendations**

### **Recommendation 1: Centralized Middleware (Validated + Enhanced)**

Your middleware centralization approach is correct, but here's an enhanced version:

// src/middleware.ts - Enhanced authentication middleware
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = '__session';

// Define route configurations
const ROUTE_CONFIG = {
  // Routes that don't require authentication
  public: ['/', '/login', '/signup', '/api/auth/csrf-token'],
  // Routes that authenticated users should be redirected away from
  authRedirect: ['/login', '/signup'],
  // API routes that need different handling
  api: {
    public: ['/api/auth/csrf-token', '/api/health'],
    protected: ['/api/user', '/api/dashboard']
  }
} as const;

async function verifySession(sessionCookie: string, origin: string): Promise<boolean> {
  try {
    // Use a dedicated internal endpoint for session verification
    const response = await fetch(`${origin}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionCookie}`,
        // Add internal request identifier
        'X-Internal-Request': 'middleware-verification'
      },
      // Shorter timeout for middleware requests
      signal: AbortSignal.timeout(3000)
    });
    
    return response.ok;
  } catch (error) {
    console.error('[Middleware] Session verification failed:', error);
    return false;
  }
}

function isPublicRoute(pathname: string): boolean {
  return ROUTE_CONFIG.public.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

function shouldRedirectAuthenticated(pathname: string): boolean {
  return ROUTE_CONFIG.authRedirect.includes(pathname);
}

function isPublicApiRoute(pathname: string): boolean {
  return ROUTE_CONFIG.api.public.some(route => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.nextUrl.origin;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  // Handle API routes differently
  if (pathname.startsWith('/api/')) {
    if (isPublicApiRoute(pathname)) {
      return NextResponse.next();
    }
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    const isValid = await verifySession(sessionCookie, origin);
    if (!isValid) {
      const response = NextResponse.json(
        { error: 'Invalid session' }, 
        { status: 401 }
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
    
    return NextResponse.next();
  }

  // Handle page routes
  if (sessionCookie) {
    const isValid = await verifySession(sessionCookie, origin);
    
    if (isValid) {
      // User is authenticated
      if (shouldRedirectAuthenticated(pathname)) {
        console.log(`[Middleware] Authenticated user accessing ${pathname}, redirecting to dashboard`);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } else {
      // Invalid session cookie
      console.log(`[Middleware] Invalid session cookie, clearing and redirecting to login`);
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
  } else {
    // No session cookie
    if (!isPublicRoute(pathname)) {
      console.log(`[Middleware] Unauthenticated access to ${pathname}, redirecting to login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

### **Recommendation 2: Simplified Session Architecture (Critical Update)**

Your recommendation to eliminate the Next.js proxy is correct, but I suggest a **hybrid approach** that's more robust:

# backend/app/api/v1/auth.py - Enhanced authentication endpoints
from fastapi import APIRouter, HTTPException, Response, Request, Depends, status
from fastapi.responses import JSONResponse
from fastapi_csrf_protect import CsrfProtect
from pydantic import BaseModel
import firebase_admin
from firebase_admin import auth as firebase_auth
from datetime import datetime, timedelta
import jwt
import secrets
from typing import Optional
import httpx

router = APIRouter()

# Pydantic models
class LoginRequest(BaseModel):
    firebase_token: str

class SessionResponse(BaseModel):
    user: dict
    expires_at: datetime
    csrf_token: str

class RefreshRequest(BaseModel):
    refresh_token: str

# Configuration
SESSION_COOKIE_NAME = "__session"
REFRESH_COOKIE_NAME = "__refresh"
CSRF_COOKIE_NAME = "csrf_token"
SESSION_DURATION = timedelta(hours=1)  # Shorter session duration
REFRESH_DURATION = timedelta(days=7)   # Longer refresh duration

async def verify_firebase_token(token: str) -> dict:
    """Verify Firebase ID token and return user data"""
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return {
            'uid': decoded_token['uid'],
            'email': decoded_token.get('email'),
            'email_verified': decoded_token.get('email_verified', False),
            'name': decoded_token.get('name'),
            'picture': decoded_token.get('picture')
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase token: {str(e)}"
        )

def create_session_token(user_data: dict) -> tuple[str, datetime]:
    """Create a JWT session token"""
    expires_at = datetime.utcnow() + SESSION_DURATION
    payload = {
        'uid': user_data['uid'],
        'email': user_data['email'],
        'exp': expires_at,
        'iat': datetime.utcnow(),
        'type': 'session'
    }
    
    # Use your secret key from settings
    token = jwt.encode(payload, "your-secret-key", algorithm="HS256")
    return token, expires_at

def create_refresh_token(user_uid: str) -> tuple[str, datetime]:
    """Create a refresh token"""
    expires_at = datetime.utcnow() + REFRESH_DURATION
    payload = {
        'uid': user_uid,
        'exp': expires_at,
        'iat': datetime.utcnow(),
        'type': 'refresh',
        'jti': secrets.token_urlsafe(32)  # Unique token ID for revocation
    }
    
    token = jwt.encode(payload, "your-secret-key", algorithm="HS256")
    return token, expires_at

async def sync_user_profile(user_data: dict):
    """Sync user profile with your database"""
    # This should contain your existing user sync logic
    # from verify-and-sync-profile endpoint
    pass

@router.post("/session-login", response_model=SessionResponse)
async def session_login(
    request: LoginRequest,
    response: Response,
    csrf_protect: CsrfProtect = Depends()
):
    """
    Atomic session login endpoint.
    Replaces the Next.js proxy pattern with direct communication.
    """
    try:
        # 1. Verify Firebase token
        user_data = await verify_firebase_token(request.firebase_token)
        
        # 2. Sync user profile in database
        await sync_user_profile(user_data)
        
        # 3. Create session and refresh tokens
        session_token, session_expires = create_session_token(user_data)
        refresh_token, refresh_expires = create_refresh_token(user_data['uid'])
        
        # 4. Generate CSRF tokens
        unsigned_token, signed_token = csrf_protect.generate_csrf_tokens()
        
        # 5. Set secure cookies
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=session_token,
            expires=session_expires,
            httponly=True,
            secure=True,  # HTTPS only
            samesite='lax',
            path='/'
        )
        
        response.set_cookie(
            key=REFRESH_COOKIE_NAME,
            value=refresh_token,
            expires=refresh_expires,
            httponly=True,
            secure=True,
            samesite='lax',
            path='/api/v1/auth'  # Restrict to auth endpoints
        )
        
        response.set_cookie(
            key=CSRF_COOKIE_NAME,
            value=signed_token,
            expires=session_expires,
            httponly=False,  # JavaScript needs access
            secure=True,
            samesite='lax',
            path='/'
        )
        
        return SessionResponse(
            user={
                'uid': user_data['uid'],
                'email': user_data['email'],
                'name': user_data.get('name'),
                'email_verified': user_data['email_verified']
            },
            expires_at=session_expires,
            csrf_token=unsigned_token  # Return unsigned token for forms
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/verify-session")
async def verify_session(
    request: Request,
    csrf_protect: CsrfProtect = Depends()
):
    """
    Verify session token - used by middleware and frontend
    """
    # Check for internal request header (from middleware)
    is_internal = request.headers.get('X-Internal-Request') == 'middleware-verification'
    
    # Get session token from Authorization header or cookie
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        session_token = auth_header.split(' ')[1]
    else:
        session_token = request.cookies.get(SESSION_COOKIE_NAME)
    
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No session token provided"
        )
    
    try:
        # Verify JWT token
        payload = jwt.decode(session_token, "your-secret-key", algorithms=["HS256"])
        
        if payload.get('type') != 'session':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        # For non-internal requests, also verify CSRF
        if not is_internal:
            await csrf_protect.validate_csrf(request)
        
        return {
            'valid': True,
            'uid': payload['uid'],
            'email': payload['email'],
            'expires_at': datetime.fromtimestamp(payload['exp'])
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token"
        )

@router.post("/refresh-session")
async def refresh_session(
    request: Request,
    response: Response,
    csrf_protect: CsrfProtect = Depends()
):
    """
    Refresh session using refresh token
    """
    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided"
        )
    
    try:
        # Verify refresh token
        payload = jwt.decode(refresh_token, "your-secret-key", algorithms=["HS256"])
        
        if payload.get('type') != 'refresh':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        # Get user data (you might want to fetch from DB here)
        user_data = {'uid': payload['uid']}  # Minimal data for refresh
        
        # Create new session token
        session_token, session_expires = create_session_token(user_data)
        unsigned_token, signed_token = csrf_protect.generate_csrf_tokens()
        
        # Set new session cookie
        response.set_cookie(
            key=SESSION_COOKIE_NAME,
            value=session_token,
            expires=session_expires,
            httponly=True,
            secure=True,
            samesite='lax',
            path='/'
        )
        
        response.set_cookie(
            key=CSRF_COOKIE_NAME,
            value=signed_token,
            expires=session_expires,
            httponly=False,
            secure=True,
            samesite='lax',
            path='/'
        )
        
        return {
            'message': 'Session refreshed',
            'expires_at': session_expires,
            'csrf_token': unsigned_token
        }
        
    except jwt.ExpiredSignatureError:
        # Clear expired refresh token
        response.delete_cookie(REFRESH_COOKIE_NAME, path='/api/v1/auth')
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.post("/logout")
async def logout(response: Response):
    """
    Logout endpoint - clears all auth cookies
    """
    response.delete_cookie(SESSION_COOKIE_NAME, path='/')
    response.delete_cookie(REFRESH_COOKIE_NAME, path='/api/v1/auth')
    response.delete_cookie(CSRF_COOKIE_NAME, path='/')
    
    return {'message': 'Logged out successfully'}

@router.get("/csrf-token")
def get_csrf_token(csrf_protect: CsrfProtect = Depends()):
    """
    Get CSRF token for forms that need it
    """
    unsigned_token, _ = csrf_protect.generate_csrf_tokens()
    return {'csrf_token': unsigned_token}

### **Recommendation 3: Complete CSRF Implementation**

The FastAPI CSRF Protect library is the recommended approach and supports the double submit cookie pattern

# backend/app/main.py - Complete CSRF protection setup
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi_csrf_protect import CsrfProtect
from fastapi_csrf_protect.exceptions import CsrfProtectError
from pydantic import BaseModel
import os

app = FastAPI(title="DuoTrak API", version="1.0.0")

# CSRF Protection Configuration
class CsrfSettings(BaseModel):
    secret_key: str = os.getenv("CSRF_SECRET_KEY", "your-super-secret-csrf-key-change-in-production")
    cookie_key: str = "csrf_token"
    header_name: str = "X-CSRF-Token"
    cookie_path: str = "/"
    cookie_domain: str = None
    cookie_secure: bool = True  # Set to True in production with HTTPS
    cookie_samesite: str = "lax"
    httponly_cookie: bool = False  # Must be False so JavaScript can read it
    cookie_max_age: int = 3600  # 1 hour

@CsrfProtect.load_config
def get_csrf_config():
    return CsrfSettings()

# CSRF Exception Handler
@app.exception_handler(CsrfProtectError)
def csrf_protect_exception_handler(request: Request, exc: CsrfProtectError):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={
            "detail": "CSRF token validation failed",
            "error": exc.message,
            "type": "csrf_error"
        }
    )

# Apply CSRF protection globally to all state-changing endpoints
from fastapi import Depends

async def csrf_protect_dependency(csrf_protect: CsrfProtect = Depends()):
    """
    Global CSRF protection dependency.
    Apply this to all POST, PUT, PATCH, DELETE endpoints.
    """
    return csrf_protect

# Alternative: Apply CSRF protection via middleware (more comprehensive)
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import json

class CSRFMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, exclude_paths: list = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/docs", "/redoc", "/openapi.json", 
            "/api/v1/auth/csrf-token",  # CSRF token endpoint itself
            "/health"  # Health check
        ]
        self.state_changing_methods = {"POST", "PUT", "PATCH", "DELETE"}

    async def dispatch(self, request: Request, call_next):
        # Skip CSRF protection for excluded paths or safe methods
        if (request.url.path in self.exclude_paths or 
            request.method not in self.state_changing_methods):
            return await call_next(request)

        # Apply CSRF protection
        try:
            csrf_protect = CsrfProtect()
            await csrf_protect.validate_csrf(request)
        except CsrfProtectError as e:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "detail": "CSRF token validation failed",
                    "error": str(e),
                    "type": "csrf_error"
                }
            )

        return await call_next(request)

# Add CSRF middleware to the app
app.add_middleware(
    CSRFMiddleware, 
    exclude_paths=[
        "/docs", "/redoc", "/openapi.json",
        "/api/v1/auth/csrf-token",
        "/api/v1/auth/session-login",  # Initial login doesn't have CSRF token yet
        "/health"
    ]
)

# Include your authentication router
from app.api.v1.auth import router as auth_router
app.include_router(auth_router, prefix="/api/v1/auth", tags=["authentication"])

# Example of how to protect individual endpoints if not using middleware
from app.api.v1.auth import csrf_protect_dependency

@app.post("/api/v1/protected-endpoint")
async def protected_endpoint(
    data: dict,
    csrf_protect: CsrfProtect = Depends(csrf_protect_dependency)
):
    """
    Example of a protected endpoint.
    CSRF validation happens automatically via the dependency.
    """
    return {"message": "This endpoint is CSRF protected"}

# Health check endpoint (no CSRF needed)
@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

### **Additional Senior-Level Recommendations**

**4. Enhanced Frontend Integration:**

// src/components/auth/LoginForm.tsx - Enhanced with direct FastAPI integration
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';

interface LoginFormData {
  email: string;
  password: string;
}

interface ApiResponse {
  user: {
    uid: string;
    email: string;
    name?: string;
    email_verified: boolean;
  };
  expires_at: string;
  csrf_token: string;
}

export default function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const { refreshUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      // 2. Get Firebase ID token
      const firebaseToken = await userCredential.user.getIdToken();
      
      // 3. Exchange token directly with FastAPI (no Next.js proxy)
      const response = await fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/api/v1/auth/session-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include cookies in request
        body: JSON.stringify({
          firebase_token: firebaseToken
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data: ApiResponse = await response.json();
      
      // 4. Store CSRF token for future requests
      localStorage.setItem('csrf_token', data.csrf_token);
      
      // 5. Refresh user context
      await refreshUser();
      
      // 6. Redirect to dashboard (middleware will handle auth state)
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}

**5. Enhanced API Client with Automatic Token Refresh:**

// src/lib/api/client.ts - Enhanced API client with auto-refresh and CSRF
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

export class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
  }

  private getCsrfToken(): string | null {
    // Try localStorage first (set during login), then cookie
    return localStorage.getItem('csrf_token') || getCookie('csrf_token') || null;
  }

  private async refreshSession(): Promise<void> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._performRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async _performRefresh(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh-session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const data = await response.json();
      
      // Update CSRF token
      if (data.csrf_token) {
        localStorage.setItem('csrf_token', data.csrf_token);
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      // Clear auth state and redirect to login
      localStorage.removeItem('csrf_token');
      window.location.href = '/login';
      throw error;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Prepare headers
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...options.headers,
    });

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        headers.set('X-CSRF-Token', csrfToken);
      }
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Always include cookies
    };

    try {
      const response = await fetch(url, requestOptions);

      // Handle 401 - try to refresh session once
      if (response.status === 401 && !this.isRefreshing) {
        await this.refreshSession();
        
        // Retry the original request with updated CSRF token
        const retryHeaders = new Headers(headers);
        const newCsrfToken = this.getCsrfToken();
        if (newCsrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) {
          retryHeaders.set('X-CSRF-Token', newCsrfToken);
        }

        const retryResponse = await fetch(url, {
          ...requestOptions,
          headers: retryHeaders,
        });

        return this.handleResponse<T>(retryResponse);
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use the status text
      }
      
      throw new Error(errorMessage);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    return response.json();
  }

  // Public API methods
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Authentication specific methods
  async logout(): Promise<void> {
    try {
      await this.post('/api/v1/auth/logout');
    } finally {
      // Always clear local state regardless of API response
      localStorage.removeItem('csrf_token');
      window.location.href = '/login';
    }
  }

  async getCurrentUser(): Promise<any> {
    return this.get('/api/v1/auth/verify-session');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Hook for React components
import { useCallback } from 'react';

export function useApiClient() {
  const client = apiClient;

  const safeRequest = useCallback(async <T>(
    request: () => Promise<T>
  ): Promise<{ data: T | null; error: string | null }> => {
    try {
      const data = await request();
      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { data: null, error: errorMessage };
    }
  }, []);

  return {
    client,
    safeRequest,
  };
}


## 🎯 **Final Senior-Level Recommendations & Action Plan**

Based on my analysis and research of current best practices, here's your validated action plan:

### **✅ Your Analysis is 100% Correct - Here's Why:**

1. **Race Conditions**: Multiple sources of authentication logic are a well-documented anti-pattern in Next.js applications
2. **Complex Flow**: Firebase documentation actually recommends server-side session management for better security, but your proxy adds unnecessary complexity
3. **CSRF Issues**: Incomplete CSRF protection is a critical security vulnerability

### **🚀 Implementation Priority (Senior Developer Approach):**

**Phase 1: Critical Security (Week 1)**
- Implement complete CSRF protection (use my FastAPI setup)
- Add proper JWT session management with refresh tokens
- This addresses your most critical security vulnerability

**Phase 2: Architecture Simplification (Week 2)**  
- Replace Next.js proxy with direct FastAPI communication
- Implement the enhanced middleware I provided
- Remove `useRedirectIfAuthenticated` hook entirely

**Phase 3: Enhanced UX (Week 3)**
- Add automatic session refresh
- Implement the enhanced API client
- Add proper error handling and loading states

### **🔥 Additional Senior-Level Insights:**

**1. Security Enhancement:** 
- Use shorter session tokens (1 hour) with longer refresh tokens (7 days)
- Implement proper JWT with `jti` for token revocation
- Add rate limiting on auth endpoints

**2. Performance Optimization:**
- Cache session verification results in middleware (Redis recommended)
- Use HTTP-only cookies for tokens, localStorage only for CSRF
- Implement proper error boundaries

**3. Monitoring & Observability:**
- Add structured logging for all auth events
- Monitor failed login attempts
- Track session refresh patterns

### **⚠️ Critical Implementation Notes:**

1. **Never store JWT tokens in localStorage** - use HTTP-only cookies only
2. **Always validate CSRF on state-changing operations**
3. **Implement proper error handling** - your current system can leave users in inconsistent states
4. **Use environment-specific configurations** - the provided code has placeholder secrets

### **🎯 Next Steps:**

1. **Start with the CSRF implementation** - it's your biggest security gap
2. **Test the middleware thoroughly** - auth bugs are the hardest to debug in production  
3. **Implement proper error monitoring** - auth failures should alert you immediately

Your original analysis was excellent - you identified real architectural problems that needed solving. The solutions I've provided follow current industry best practices and will give you a robust, secure, and maintainable authentication system.

Would you like me to help you with any specific implementation details or create additional code for testing these changes?