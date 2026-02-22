// src/lib/api/client.ts - Enhanced API client with auto-refresh and CSRF
import { getCookie } from 'cookies-next';

export class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    console.log('--- [ApiClient] Initialized with baseUrl:', this.baseUrl);
  }

  private getCsrfToken(): string | null {
    // Try localStorage first (set during login), then cookie
    if (typeof window !== 'undefined') {
      return localStorage.getItem('csrf_token') || getCookie('csrf_token')?.toString() || null;
    }
    return getCookie('csrf_token')?.toString() || null;
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
      if (typeof window !== 'undefined' && data.csrf_token) {
        localStorage.setItem('csrf_token', data.csrf_token);
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      // Clear auth state and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('csrf_token');
        window.location.href = '/login';
      }
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

      // Handle 401 - try to refresh session once if it looks like an expired token
      if (response.status === 401 && !new Headers(options.headers).get('X-No-Refresh')) {
        try {
          const errorData = await response.clone().json();
          if (errorData.detail === "Session expired") {
            await this.refreshSession();

            // Retry the original request
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
        } catch (e) {
          // Could not parse JSON body, or other error, proceed to handle as a normal error
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      try {
        // Try to parse the error response body
        const errorData = await response.json();
        // Use a detailed message from the backend if available
        const message = errorData.detail || (Array.isArray(errorData.detail) && errorData.detail.map((e: any) => e.msg).join(', ')) || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(message);
      } catch (e) {
        // If parsing fails or it's not a JSON response, fall back to status text
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('csrf_token');
        window.location.href = '/login';
      }
    }
  }

  async getCurrentUser(): Promise<any> {
    console.log('--- [ApiClient] getCurrentUser called ---');
    return this.get('/api/v1/users/me');
  }

  async completePartneredOnboarding(): Promise<any> {
    return this.patch('/api/v1/users/me/complete-onboarding');
  }

  async createOnboardingGoal(goal: any, task: any): Promise<any> {
    return this.post('/api/v1/goals/onboarding', { goal, task });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
