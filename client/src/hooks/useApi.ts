/**
 * useApi Hook - Reusable hook for API calls with loading/error states
 * Optional helper for common API patterns
 */

'use client';

import { useState, useCallback } from 'react';
import { ApiError } from '@/lib/api';

/**
 * Hook state interface
 */
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook return interface
 */
interface UseApiReturn<T, P extends any[]> extends UseApiState<T> {
  execute: (...params: P) => Promise<T | null>;
  reset: () => void;
}

/**
 * Custom hook for API calls with built-in loading and error state management
 * 
 * @param apiFunction - Async function that makes the API call
 * @returns Object with data, loading, error states and execute function
 * 
 * @example
 * ```tsx
 * function JobsList() {
 *   const { data: jobs, loading, error, execute } = useApi(
 *     async (page: number) => get(`/jobs?page=${page}`)
 *   );
 *   
 *   useEffect(() => {
 *     execute(1);
 *   }, []);
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!jobs) return null;
 *   
 *   return <div>{jobs.map(job => ...)}</div>;
 * }
 * ```
 */
export function useApi<T = any, P extends any[] = any[]>(
  apiFunction: (...params: P) => Promise<T>
): UseApiReturn<T, P> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });
  
  /**
   * Execute the API call
   */
  const execute = useCallback(
    async (...params: P): Promise<T | null> => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));
      
      try {
        const result = await apiFunction(...params);
        
        setState({
          data: result,
          loading: false,
          error: null,
        });
        
        return result;
      } catch (err) {
        const errorMessage = err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'An unexpected error occurred';
        
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
        
        return null;
      }
    },
    [apiFunction]
  );
  
  /**
   * Reset the state to initial values
   */
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);
  
  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for immediate API calls (executes on mount)
 * 
 * @param apiFunction - Async function that makes the API call
 * @param params - Parameters to pass to the API function
 * @returns Object with data, loading, error states and refetch function
 * 
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data: user, loading, error, refetch } = useApiImmediate(
 *     (id: string) => get(`/users/${id}`),
 *     [userId]
 *   );
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!user) return null;
 *   
 *   return (
 *     <div>
 *       <h1>{user.name}</h1>
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useApiImmediate<T = any, P extends any[] = any[]>(
  apiFunction: (...params: P) => Promise<T>,
  params: P
): Omit<UseApiReturn<T, P>, 'execute'> & { refetch: () => Promise<T | null> } {
  const { data, loading, error, execute, reset } = useApi<T, P>(apiFunction);
  
  // Execute immediately on mount or when params change
  const [mounted, setMounted] = useState(false);
  
  const refetch = useCallback(async () => {
    return execute(...params);
  }, [execute, params]);
  
  // Use effect to call on mount and param changes
  if (!mounted) {
    setMounted(true);
    refetch();
  }
  
  return {
    data,
    loading,
    error,
    refetch,
    reset,
  };
}
