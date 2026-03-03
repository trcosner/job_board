/**
 * Home Page - Landing page for the job board
 */

'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';
import { ArrowRight } from 'lucide-react';
import styles from "./page.module.css";

export default function Home() {
  const { user, loading } = useAuth();
  
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* Hero Section */}
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Find Your Dream Job
          </h1>
          <p className={styles.heroSubtitle}>
            Connect with top employers and discover opportunities that match your skills and aspirations
          </p>
          
          <div className={styles.heroActions}>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : user ? (
              <>
                <Link href={ROUTES.DASHBOARD}>
                  <Button variant="primary" size="lg">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href={ROUTES.JOBS}>
                  <Button variant="outline" size="lg">
                    Browse Jobs
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href={ROUTES.REGISTER}>
                  <Button variant="primary" size="lg">
                    Get Started
                  </Button>
                </Link>
                <Link href={ROUTES.LOGIN}>
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Features Section */}
        <div className={styles.features}>
          <div className={styles.feature}>
            <h3 className={styles.featureTitle}>Smart Search</h3>
            <p className={styles.featureText}>
              Find jobs that match your skills, experience, and preferences
            </p>
          </div>
          
          <div className={styles.feature}>
            <h3 className={styles.featureTitle}>Direct Connect</h3>
            <p className={styles.featureText}>
              Connect directly with employers and stand out from the crowd
            </p>
          </div>
          
          <div className={styles.feature}>
            <h3 className={styles.featureTitle}>Track Progress</h3>
            <p className={styles.featureText}>
              Monitor your applications and get real-time updates
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
