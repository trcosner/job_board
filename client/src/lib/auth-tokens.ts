/**
 * Token Management - localStorage utilities
 * Handles storage and retrieval of JWT tokens with SSR safety
 */

import { STORAGE_KEYS } from './constants';

/**
 * Check if we're in a browser environment
 * Function call instead of constant to avoid SSR hydration mismatch
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get the access token from localStorage
 */
export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  
  try {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('Error reading access token from localStorage:', error);
    return null;
  }
}

/**
 * Set the access token in localStorage
 */
export function setAccessToken(token: string): void {
  if (!isBrowser()) return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  } catch (error) {
    console.error('Error saving access token to localStorage:', error);
  }
}

/**
 * Get the refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  
  try {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Error reading refresh token from localStorage:', error);
    return null;
  }
}

/**
 * Set the refresh token in localStorage
 */
export function setRefreshToken(token: string): void {
  if (!isBrowser()) return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  } catch (error) {
    console.error('Error saving refresh token to localStorage:', error);
  }
}

/**
 * Set both access and refresh tokens
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
}

/**
 * Remove all tokens from localStorage (logout)
 */
export function removeTokens(): void {
  if (!isBrowser()) return;
  
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    console.error('Error removing tokens from localStorage:', error);
  }
}

/**
 * Check if we have a valid access token
 */
export function hasAccessToken(): boolean {
  const token = getAccessToken();
  return token !== null && token.length > 0;
}

/**
 * Check if we have a valid refresh token
 */
export function hasRefreshToken(): boolean {
  const token = getRefreshToken();
  return token !== null && token.length > 0;
}

/**
 * Decode JWT token (without verification - for reading claims only)
 * Returns null if token is invalid
 */
export function decodeToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  
  return currentTime >= expirationTime;
}

/**
 * Check if token will expire soon (within threshold)
 */
export function isTokenExpiringSoon(token: string, thresholdMs: number = 5 * 60 * 1000): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  
  return (expirationTime - currentTime) < thresholdMs;
}
