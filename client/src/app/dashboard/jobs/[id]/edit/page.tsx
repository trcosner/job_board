'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { JobForm } from '@/components/jobs/JobForm';
import { getJob, updateJob } from '@/lib/api';
import type { JobWithCompany, CreateJobData } from '@/types/job';
import { ROUTES } from '@/lib/constants';
import styles from '../../new/page.module.css';

export default function EditJobPage() {
  const params = useParams<{ id: string }>();
  const { user, onboardingComplete, loading: authLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<JobWithCompany | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace(ROUTES.LOGIN); return; }
    if (user.userType !== 'employer') { router.replace(ROUTES.DASHBOARD); return; }
    if (!onboardingComplete) { router.replace(ROUTES.ONBOARDING_COMPANY); return; }

    setLoadingJob(true);
    getJob(params.id)
      .then(({ job: data }) => setJob(data))
      .catch(() => setError('Job not found or you do not have permission to edit it.'))
      .finally(() => setLoadingJob(false));
  }, [authLoading, user, onboardingComplete, params.id, router]);

  async function handleSubmit(data: CreateJobData) {
    if (!job) return;
    setSaving(true);
    setError('');
    try {
      await updateJob(job.id, data);
      router.push(ROUTES.JOB(job.id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update job.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  const isLoading = authLoading || loadingJob;

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.centered}>
          <div className={styles.spinner} aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className={styles.page}>
        <div className={styles.accessDenied}>
          <p className={styles.accessTitle}>Unable to edit job</p>
          <p className={styles.accessText}>{error}</p>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href={ROUTES.JOB(job.id)} className={styles.backLink}>
          ← Back to job
        </Link>

        <div className={styles.header}>
          <h1 className={styles.title}>Edit Job</h1>
          <p className={styles.subtitle}>{job.title}</p>
        </div>

        <div className={styles.card}>
          <JobForm
            onSubmit={handleSubmit}
            initialValues={{
              title: job.title,
              description: job.description,
              job_type: job.job_type,
              experience_level: job.experience_level ?? undefined,
              remote: job.remote,
              location: job.location ?? undefined,
              salary_min: job.salary_min ?? undefined,
              salary_max: job.salary_max ?? undefined,
              required_skills: job.required_skills,
              application_deadline: job.application_deadline ?? undefined,
              status: job.status,
            }}
            loading={saving}
            submitLabel="Save Changes"
            onCancel={() => router.push(ROUTES.JOB(job.id))}
            allowDraft={job.status !== 'active'}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
