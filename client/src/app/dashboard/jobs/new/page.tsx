'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { JobForm } from '@/components/jobs/JobForm';
import { createJob } from '@/lib/api';
import type { CreateJobData } from '@/types/job';
import { ROUTES } from '@/lib/constants';
import styles from './page.module.css';

export default function NewJobPage() {
  const { user, onboardingComplete, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace(ROUTES.LOGIN); return; }
    if (user.userType !== 'employer') { router.replace(ROUTES.DASHBOARD); return; }
    if (!onboardingComplete) { router.replace(ROUTES.ONBOARDING_COMPANY); }
  }, [user, onboardingComplete, loading, router]);

  async function handleSubmit(data: CreateJobData) {
    const { job } = await createJob(data);
    router.push(ROUTES.JOB(job.id));
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.centered}>
          <div className={styles.spinner} aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (!user || user.userType !== 'employer') return null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href={ROUTES.DASHBOARD_JOBS} className={styles.backLink}>
          ← Back to my jobs
        </Link>

        <div className={styles.header}>
          <h1 className={styles.title}>Post a New Job</h1>
          <p className={styles.subtitle}>
            Fill in the details below. You can save as draft and publish later.
          </p>
        </div>

        <div className={styles.card}>
          <JobForm
            onSubmit={handleSubmit}
            loading={false}
            submitLabel="Publish Job"
            onCancel={() => router.push(ROUTES.DASHBOARD_JOBS)}
            allowDraft
          />
        </div>
      </div>
    </div>
  );
}
