/**
 * Auth Context - Global authentication state management
 * Uses React Context + useState for simple, production-ready auth
 */

'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type {
  AuthContextState,
  UserProfile,
  LoginRequestParams,
  RegistrationRequestParams,
  LoginResponse,
  RegistrationResponse,
} from '@/types/auth';
import { post, get } from '@/lib/api';
import {
  setTokens,
  removeTokens,
  hasAccessToken,
  getAccessToken,
} from '@/lib/auth-tokens';
import { API_ENDPOINTS, ROUTES, SUCCESS_MESSAGES } from '@/lib/constants';
import { trackEvent } from '@/lib/analytics';
import { AnalyticsEventName } from '@/types/analytics';

/**
 * Create the Auth Context
 */
export const AuthContext = createContext<AuthContextState | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider Component
 * Wraps the app and provides authentication state and methods
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  
  /**
   * Load the current user from the API using the stored token
   * Called on mount if a token exists
   */
  const loadUser = useCallback(async () => {
    // Check if we have a token
    if (!hasAccessToken()) {
      setLoading(false);
      return;
    }
    
    try {
      // Fetch user profile from /auth/me
      const userData = await get<{ user: UserProfile }>(API_ENDPOINTS.AUTH.ME);
      setUser(userData.user);
    } catch (error) {
      console.error('Failed to load user:', error);
      // Clear invalid tokens
      removeTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Load user on mount if token exists
   */
  useEffect(() => {
    loadUser();
  }, [loadUser]);
  
  /**
   * Refresh auth state (reload user from API)
   */
  const refreshAuth = useCallback(async () => {
    if (!hasAccessToken()) {
      setUser(null);
      return;
    }
    
    try {
      const userData = await get<{ user: UserProfile }>(API_ENDPOINTS.AUTH.ME);
      setUser(userData.user);
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      removeTokens();
      setUser(null);
    }
  }, []);
  
  /**
   * Login function
   * @param params - Email and password
   */
  const login = useCallback(async (params: LoginRequestParams) => {
    try {
      // Call login API
      const response = await post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        params,
        { requiresAuth: false }
      );
      
      // Store tokens
      setTokens(response.accessToken, response.refreshToken);
      
      // Set user state
      setUser(response.user);
      
      // Redirect to dashboard
      router.push(ROUTES.DASHBOARD);
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [router]);
  
  /**
   * Register function
   * @param params - Registration details
   */
  const register = useCallback(async (params: RegistrationRequestParams) => {
    try {
      // Call register API
      const response = await post<RegistrationResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        params,
        { requiresAuth: false }
      );
      
      // Store tokens
      setTokens(response.accessToken, response.refreshToken);
      
      // Set user state
      setUser(response.user);
      
      // Redirect to dashboard
      router.push(ROUTES.DASHBOARD);
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }, [router]);
  
  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    try {
      // Track logout event
      trackEvent(AnalyticsEventName.USER_LOGOUT);
      
      // Call logout API (best effort - don't block on failure)
      const token = getAccessToken();
      if (token) {
        await post(API_ENDPOINTS.AUTH.LOGOUT, {}, { requiresAuth: true }).catch(
          (error) => console.error('Logout API call failed:', error)
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state and tokens
      removeTokens();
      setUser(null);
      
      // Redirect to home
      router.push(ROUTES.HOME);
    }
  }, [router]);
  
  /**
   * Context value
   */
  const value: AuthContextState = {
    user,
    loading,
    login,
    register,
    logout,
    refreshAuth,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
