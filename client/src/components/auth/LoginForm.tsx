/**
 * LoginForm Component
 * Form for user authentication with validation
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { validateLogin } from '@/lib/validation';
import { ApiError } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { AnalyticsEventName } from '@/types/analytics';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const { login } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    setApiError(null);
    
    // Validate form
    const validation = validateLogin(email, password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    // Track login attempt
    trackEvent(AnalyticsEventName.USER_LOGIN_STARTED, {
      properties: { method: 'email' }
    });
    
    // Submit login
    setLoading(true);
    
    try {
      await login({ email, password });
      
      // Track successful login
      trackEvent(AnalyticsEventName.USER_LOGIN_COMPLETED, {
        properties: { method: 'email' }
      });
      
      // Success - AuthContext will redirect
    } catch (error) {
      console.error('Login error:', error);
      
      // Track failed login
      trackEvent(AnalyticsEventName.USER_LOGIN_FAILED, {
        properties: {
          method: 'email',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.header}>
        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.subtitle}>Sign in to your account</p>
      </div>
      
      {apiError && (
        <Alert variant="error">{apiError}</Alert>
      )}
      
      <div className={styles.fields}>
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
          fullWidth
          disabled={loading}
        />
        
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
          fullWidth
          disabled={loading}
        />
      </div>
      
      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        fullWidth
      >
        Sign in
      </Button>
    </form>
  );
}
