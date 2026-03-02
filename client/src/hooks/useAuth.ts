/**
 * useAuth Hook - Consumer hook for AuthContext
 * Provides convenient access to authentication state and methods
 */

'use client';

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import type { AuthContextState } from '@/types/auth';

/**
 * Hook to access authentication context
 * Must be used within an AuthProvider
 * 
 * @returns Authentication state and methods
 * @throws Error if used outside AuthProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, login, logout, loading } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   
 *   if (!user) {
 *     return <button onClick={() => login(...)}>Login</button>;
 *   }
 *   
 *   return <div>Welcome {user.firstName}!</div>;
 * }
 * ```
 */
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component is wrapped with <AuthProvider>.'
    );
  }
  
  return context;
}
