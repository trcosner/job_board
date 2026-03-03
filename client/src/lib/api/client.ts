/**
 * API Client - Fetch wrapper with token handling and refresh logic
 * Automatically attaches auth tokens and handles 401 responses
 */

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  removeTokens,
  isTokenExpired,
} from '../auth-tokens';
import { API_BASE_URL, API_ENDPOINTS, HTTP_STATUS, ERROR_MESSAGES, ROUTES } from '../constants';
import type { LoginResponse } from '@/types/auth';

/**
 * API Error class for structured error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Track if a token refresh is in progress to avoid multiple simultaneous refreshes
 */
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string> {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  
  isRefreshing = true;
  
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      // Check if refresh token is expired
      if (isTokenExpired(refreshToken)) {
        throw new Error('Refresh token expired');
      }
      
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      const data: LoginResponse = await response.json();
      
      // Store new tokens
      setTokens(data.accessToken, data.refreshToken);
      
      return data.accessToken;
    } catch (error) {
      // Clear tokens on refresh failure
      removeTokens();
      
      // Redirect to login (only in browser)
      if (typeof window !== 'undefined') {
        window.location.href = ROUTES.LOGIN;
      }
      
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
}

/**
 * Options for fetchApi function
 */
export interface FetchApiOptions extends RequestInit {
  requiresAuth?: boolean;
  retryOnUnauthorized?: boolean;
}

/**
 * Main API client function using native fetch
 * 
 * @param endpoint - API endpoint (e.g., '/auth/login')
 * @param options - Fetch options with additional custom options
 * @returns Response data
 */
export async function fetchApi<T = any>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<T> {
  const {
    requiresAuth = true,
    retryOnUnauthorized = true,
    headers = {},
    ...fetchOptions
  } = options;
  
  // Build full URL
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;
  
  // Build headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };
  
  // Add authorization header if required
  if (requiresAuth) {
    const accessToken = getAccessToken();
    if (accessToken) {
      requestHeaders['Authorization'] = `Bearer ${accessToken}`;
    }
  }
  
  try {
    // Make the request
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
    });
    
    // Handle 401 Unauthorized - try to refresh token
    if (response.status === HTTP_STATUS.UNAUTHORIZED && requiresAuth && retryOnUnauthorized) {
      try {
        // Attempt token refresh
        const newAccessToken = await refreshAccessToken();
        
        // Retry the original request with new token
        requestHeaders['Authorization'] = `Bearer ${newAccessToken}`;
        
        const retryResponse = await fetch(url, {
          ...fetchOptions,
          headers: requestHeaders,
        });
        
        return handleResponse<T>(retryResponse);
      } catch (refreshError) {
        // Token refresh failed, throw original error
        throw new ApiError(
          ERROR_MESSAGES.UNAUTHORIZED,
          HTTP_STATUS.UNAUTHORIZED
        );
      }
    }
    
    return handleResponse<T>(response);
  } catch (error) {
    // Network error or other fetch error
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      ERROR_MESSAGES.NETWORK_ERROR,
      undefined,
      error
    );
  }
}

/**
 * Handle the response from fetch
 */
async function handleResponse<T>(response: Response): Promise<T> {
  // Handle 204 No Content
  if (response.status === HTTP_STATUS.NO_CONTENT) {
    return {} as T;
  }
  
  // Parse response body
  let data: any;
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  // Handle successful responses
  if (response.ok) {
    return data as T;
  }
  
  // Handle error responses
  const errorMessage = 
    data?.message ||
    data?.error ||
    getErrorMessageForStatus(response.status);
  
  throw new ApiError(errorMessage, response.status, data);
}

/**
 * Get user-friendly error message for HTTP status code
 */
function getErrorMessageForStatus(status: number): string {
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case HTTP_STATUS.UNAUTHORIZED:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case HTTP_STATUS.FORBIDDEN:
      return 'You do not have permission to perform this action.';
    case HTTP_STATUS.NOT_FOUND:
      return 'The requested resource was not found.';
    case HTTP_STATUS.CONFLICT:
      return 'This resource already exists.';
    case HTTP_STATUS.UNPROCESSABLE_ENTITY:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      return 'Too many requests. Please try again later.';
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return ERROR_MESSAGES.SERVER_ERROR;
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
}

/**
 * Convenience methods for common HTTP verbs
 */

export async function get<T = any>(
  endpoint: string,
  options?: FetchApiOptions
): Promise<T> {
  return fetchApi<T>(endpoint, { ...options, method: 'GET' });
}

export async function post<T = any>(
  endpoint: string,
  body?: any,
  options?: FetchApiOptions
): Promise<T> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function put<T = any>(
  endpoint: string,
  body?: any,
  options?: FetchApiOptions
): Promise<T> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function patch<T = any>(
  endpoint: string,
  body?: any,
  options?: FetchApiOptions
): Promise<T> {
  return fetchApi<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function del<T = any>(
  endpoint: string,
  options?: FetchApiOptions
): Promise<T> {
  return fetchApi<T>(endpoint, { ...options, method: 'DELETE' });
}
