/**
 * Auth Context - Global authentication state management
 * Handles user + employer company state with proper onboarding routing.
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
import type { Company } from '@/types/company';
import { post, get, getMyCompany } from '@/lib/api';
import { ApiError } from '@/lib/api/client';
import {
  setTokens,
  removeTokens,
  hasAccessToken,
  getAccessToken,
} from '@/lib/auth-tokens';
import { API_ENDPOINTS, ROUTES } from '@/lib/constants';

export const AuthContext = createContext<AuthContextState | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userCompany, setUserCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  /**
   * Fetch the employer's company. Returns null on 404 or any other error.
   */
  const fetchCompany = useCallback(async (): Promise<Company | null> => {
    try {
      const { company } = await getMyCompany();
      return company;
    } catch {
      return null;
    }
  }, []);

  /**
   * Load current user (and company, if employer) on mount.
   */
  const loadUser = useCallback(async () => {
    if (!hasAccessToken()) {
      setLoading(false);
      return;
    }

    try {
      const { user: userData } = await get<{ user: UserProfile }>(API_ENDPOINTS.AUTH.ME);
      setUser(userData);

      if (userData.userType === 'employer') {
        const company = await fetchCompany();
        setUserCompany(company);
      }
    } catch (err) {
      // Only clear tokens on a definitive auth rejection (401).
      // Transient failures (network error, 429, 500) should not log the user out.
      const status = err instanceof ApiError ? err.statusCode : null;
      if (status === 401) {
        removeTokens();
        setUser(null);
        setUserCompany(null);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchCompany]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /**
   * Refresh auth state (reload user and company from API).
   */
  const refreshAuth = useCallback(async () => {
    if (!hasAccessToken()) {
      setUser(null);
      setUserCompany(null);
      return;
    }

    try {
      const { user: userData } = await get<{ user: UserProfile }>(API_ENDPOINTS.AUTH.ME);
      setUser(userData);

      if (userData.userType === 'employer') {
        const company = await fetchCompany();
        setUserCompany(company);
      } else {
        setUserCompany(null);
      }
    } catch {
      removeTokens();
      setUser(null);
      setUserCompany(null);
    }
  }, [fetchCompany]);

  /**
   * Login — stores tokens, loads company for employers, routes appropriately.
   */
  const login = useCallback(
    async (params: LoginRequestParams): Promise<LoginResponse> => {
      const response = await post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, params, {
        requiresAuth: false,
      });

      setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);

      if (response.user.userType === 'employer') {
        const company = await fetchCompany();
        setUserCompany(company);
        router.push(company ? ROUTES.DASHBOARD : ROUTES.ONBOARDING_COMPANY);
      } else {
        setUserCompany(null);
        router.push(ROUTES.DASHBOARD);
      }

      return response;
    },
    [router, fetchCompany]
  );

  /**
   * Register — stores tokens, routes employer to onboarding, job seeker to dashboard.
   */
  const register = useCallback(
    async (params: RegistrationRequestParams): Promise<RegistrationResponse> => {
      const response = await post<RegistrationResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        params,
        { requiresAuth: false }
      );

      setTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
      setUserCompany(null);

      router.push(
        response.user.userType === 'employer'
          ? ROUTES.ONBOARDING_COMPANY
          : ROUTES.DASHBOARD
      );

      return response;
    },
    [router]
  );

  /**
   * Logout — clears all state and tokens.
   */
  const logout = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (token) {
        await post(API_ENDPOINTS.AUTH.LOGOUT, {}, { requiresAuth: true }).catch(() => {});
      }
    } finally {
      removeTokens();
      setUser(null);
      setUserCompany(null);
      router.push(ROUTES.HOME);
    }
  }, [router]);

  /** True once an employer has a company; always true for job seekers. */
  const onboardingComplete =
    user?.userType === 'employer' ? userCompany !== null : true;

  const value: AuthContextState = {
    user,
    userCompany,
    onboardingComplete,
    loading,
    login,
    register,
    logout,
    refreshAuth,
    setUserCompany,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
