/**
 * Dashboard – Company Profile
 * Employer views their company; redirects to onboarding if none exists.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CompanyProfile } from '@/components/companies/CompanyProfile';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ROUTES } from '@/lib/constants';
import { getMyCompany } from '@/lib/api/companies';
import type { CompanyWithStats } from '@/types/company';
import styles from './page.module.css';

export default function DashboardCompanyPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [company, setCompany] = useState<CompanyWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN);
      return;
    }
    if (!authLoading && user?.userType !== 'employer') {
      router.push(ROUTES.DASHBOARD);
      return;
    }
    if (!authLoading && user) {
      fetchCompany();
    }
  }, [user, authLoading]);

  async function fetchCompany() {
    try {
      setLoading(true);
      const res = await getMyCompany();
      setCompany(res.company as CompanyWithStats);
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e?.status === 404) {
        // No company yet — redirect to onboarding
        router.push(ROUTES.ONBOARDING_COMPANY);
        return;
      }
      setError('Failed to load company profile.');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading company...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Alert variant="error">{error}</Alert>
          <Button variant="outline" onClick={fetchCompany}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Company Profile</h1>
            <p className={styles.pageSubtitle}>How candidates see your company</p>
          </div>
          <Link href={ROUTES.DASHBOARD_COMPANY_EDIT}>
            <Button variant="primary">Edit Profile</Button>
          </Link>
        </div>

        <CompanyProfile
          company={company}
          isOwner
          onEdit={() => router.push(ROUTES.DASHBOARD_COMPANY_EDIT)}
        />
      </div>
    </div>
  );
}
