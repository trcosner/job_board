/**
 * RegisterForm Component
 * Form for new user registration with validation
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { validateRegistration } from '@/lib/validation';
import { ApiError } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { AnalyticsEventName } from '@/types/analytics';
import type { UserType } from '@/types/auth';
import styles from './RegisterForm.module.css';

export function RegisterForm() {
  const { register } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userType, setUserType] = useState<UserType | ''>('');
  
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
    const validation = validateRegistration(
      email,
      password,
      firstName,
      lastName,
      userType as string
    );
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    // Track registration attempt
    trackEvent(AnalyticsEventName.USER_REGISTER_STARTED, {
      properties: {
        userType: userType as UserType,
        method: 'email'
      }
    });
    
    // Submit registration
    setLoading(true);
    
    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        userType: userType as UserType,
      });
      
      // Track successful registration
      trackEvent(AnalyticsEventName.USER_REGISTER_COMPLETED, {
        properties: {
          userType: userType as UserType,
          method: 'email'
        }
      });
      
      // Success - AuthContext will redirect
    } catch (error) {
      console.error('Registration error:', error);
      
      // Track failed registration
      trackEvent(AnalyticsEventName.USER_REGISTER_FAILED, {
        properties: {
          userType: userType as UserType,
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
        <h2 className={styles.title}>Create your account</h2>
        <p className={styles.subtitle}>Join our job board today</p>
      </div>
      
      {apiError && (
        <Alert variant="error">{apiError}</Alert>
      )}
      
      <div className={styles.fields}>
        {/* User Type Selection */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            I am a <span className={styles.required}>*</span>
          </label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="userType"
                value="job_seeker"
                checked={userType === 'job_seeker'}
                onChange={(e) => setUserType(e.target.value as UserType)}
                disabled={loading}
                className={styles.radio}
              />
              <span className={styles.radioText}>Job Seeker</span>
            </label>
            
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="userType"
                value="employer"
                checked={userType === 'employer'}
                onChange={(e) => setUserType(e.target.value as UserType)}
                disabled={loading}
                className={styles.radio}
              />
              <span className={styles.radioText}>Employer</span>
            </label>
          </div>
          {errors.userType && (
            <p className={styles.fieldError}>{errors.userType}</p>
          )}
        </div>
        
        {/* Name Fields */}
        <div className={styles.nameFields}>
          <Input
            label="First Name"
            type="text"
            name="firstName"
            autoComplete="given-name"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.firstName}
            required
            fullWidth
            disabled={loading}
          />
          
          <Input
            label="Last Name"
            type="text"
            name="lastName"
            autoComplete="family-name"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.lastName}
            required
            fullWidth
            disabled={loading}
          />
        </div>
        
        {/* Email */}
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
        
        {/* Password */}
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          helperText="At least 8 characters with uppercase, lowercase, and number"
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
        Create Account
      </Button>
    </form>
  );
}
