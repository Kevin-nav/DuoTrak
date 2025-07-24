import { toast } from 'sonner';
import { env } from '@/lib/env';

// --- CSRF Protection ---
// A local variable to cache the CSRF token.
let csrfToken: string | null = null;

/**
 * Fetches the CSRF token from the backend if it hasn't been fetched yet.
 * This function is called automatically by apiFetch before making a request.
 */
const getCsrfToken = async (): Promise<string> => {
  if (csrfToken) {
    return csrfToken;
  }

  try {
    // Use a direct fetch call to avoid circular dependency with apiFetch
    const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }
    
    // The library sets a cookie named 'fastapi-csrf-token'. We need to read
    // this cookie's value to send it in the 'X-CSRF-Token' header.
    const match = document.cookie.match(/fastapi-csrf-token=([^;]+)/);
    if (!match) {
        throw new Error('CSRF token cookie not found');
    }
    csrfToken = match[1];
    return csrfToken;

  } catch (error) {
    console.error('CSRF token fetch error:', error);
    toast.error('Failed to initialize secure session. Please try refreshing the page.');
    throw error;
  }
};


export class ApiError extends Error {
  constructor(public detail: string, public status: number) {
    super(detail);
    this.name = 'ApiError';
  }
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    cache: 'no-store', // Ensure we always get the freshest data
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
  };

  // For any method that is not GET, ensure we have a CSRF token and add it to the headers.
  if (config.method && config.method.toUpperCase() !== 'GET') {
    const token = await getCsrfToken();
    if (token) {
      (config.headers as Record<string, string>)['X-CSRF-Token'] = token;
    }
  }

  const fullUrl = `${env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(fullUrl, config);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { detail: 'An unknown error occurred. The server response was not valid JSON.' };
      }
      console.error('API Error:', errorData);
      throw new ApiError(errorData.detail || `HTTP error! status: ${response.status}`, response.status);
    }

    if (response.status === 204) { // No Content
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Network or fetch error:', error);
    // Only show a generic toast if it's NOT an ApiError, which should be handled by the caller.
    if (!(error instanceof ApiError)){
        toast.error('A network error occurred. Please check your connection.');
    }
    throw error;
  }
}

export async function apiFetchWithFile(endpoint: string, formData: FormData) {
  // Ensure CSRF token is fetched and available
  const token = await getCsrfToken();

  const config: RequestInit = {
    method: 'POST', // File uploads are typically POST requests
    credentials: 'include',
    cache: 'no-store',
    body: formData,
    headers: {
        // Add the CSRF token to the headers for file uploads as well.
        'X-CSRF-Token': token,
    }
    // NOTE: We DO NOT set the 'Content-Type' header.
    // The browser will automatically set it to 'multipart/form-data'
    // with the correct boundary, which is crucial for file uploads.
  };

  const fullUrl = `${env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(fullUrl, config);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { detail: 'An unknown error occurred during file upload.' };
      }
      console.error('API File Upload Error:', errorData);
      throw new ApiError(errorData.detail || `HTTP error! status: ${response.status}`, response.status);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Network or fetch error during file upload:', error);
    if (!(error instanceof ApiError)){
        toast.error('A network error occurred during file upload.');
    }
    throw error;
  }
}
