/**
 * Dashboard Page - Protected route for authenticated users
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';
import styles from './page.module.css';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push(ROUTES.LOGIN);
    }
  }, [user, loading, router]);
  
  // Show loading state while checking auth
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't render until we have a user
  if (!user) {
    return null;
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>Welcome back, {user.firstName}! 👋</h1>
          <p className={styles.subtitle}>
            You&apos;re logged in as a <strong>{user.userType === 'job_seeker' ? 'Job Seeker' : 'Employer'}</strong>
          </p>
        </header>
        
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Your Profile</h2>
          <div className={styles.profileGrid}>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Email</span>
              <span className={styles.profileValue}>{user.email}</span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Name</span>
              <span className={styles.profileValue}>
                {user.firstName} {user.lastName}
              </span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Account Type</span>
              <span className={styles.profileValue}>
                {user.userType === 'job_seeker' ? 'Job Seeker' : 'Employer'}
              </span>
            </div>
            <div className={styles.profileItem}>
              <span className={styles.profileLabel}>Member Since</span>
              <span className={styles.profileValue}>
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
        
        <div className={styles.actions}>
          <Button variant="outline" onClick={() => router.push(ROUTES.HOME)}>
            Back to Home
          </Button>
          <Button variant="danger" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
