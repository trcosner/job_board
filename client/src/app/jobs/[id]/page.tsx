'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getJob, deleteJob } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import type { JobWithCompany } from '@/types/job';
import { JOB_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '@/types/job';
import { ROUTES } from '@/lib/constants';
import styles from './page.module.css';

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [job, setJob] = useState<JobWithCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleDelete() {
    if (!job) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteJob(job.id);
      router.push(ROUTES.DASHBOARD_JOBS);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete job. Please try again.');
      setDeleting(false);
    }
  }

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    getJob(params.id)
      .then(({ job: data }) => setJob(data))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Job not found or no longer available.';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.centered}>
          <div className={styles.spinner} aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <p className={styles.errorTitle}>Job not found</p>
          <p className={styles.errorText}>{error}</p>
          <br />
          <Link href={ROUTES.JOBS} style={{ color: 'var(--color-accent-600)' }}>
            ← Back to jobs
          </Link>
        </div>
      </div>
    );
  }

  const { company } = job;
  const initials = company.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const salary = formatSalary(job.salary_min, job.salary_max);
  const isJobSeeker = user?.userType === 'job_seeker';
  const isOwner =
    user?.userType === 'employer'; // more precise check requires comparing company ids

  return (
    <>
      <div className={styles.page}>
      <div style={{ maxWidth: 'var(--container-lg)', margin: '0 auto' }}>
        {/* Back link */}
        <Link href={ROUTES.JOBS} className={styles.backLink}>
          ← Back to jobs
        </Link>
      </div>

      <div className={styles.container}>
        {/* Main card */}
        <main>
          {/* Header */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              {company.logo_url ? (
                <Image
                  src={company.logo_url}
                  alt={`${company.name} logo`}
                  width={64}
                  height={64}
                  className={styles.companyLogo}
                />
              ) : (
                <div className={styles.companyLogoPlaceholder} aria-hidden="true">
                  {initials}
                </div>
              )}
              <div className={styles.headerInfo}>
                <h1 className={styles.jobTitle}>{job.title}</h1>
                <Link href={ROUTES.COMPANY(company.slug)} className={styles.companyName}>
                  {company.name}
                </Link>
              </div>
            </div>

            {/* Badges */}
            <div className={styles.badges}>
              <span className={`${styles.badge} ${styles.badgeType}`}>
                {JOB_TYPE_LABELS[job.job_type]}
              </span>
              {job.remote && (
                <span className={`${styles.badge} ${styles.badgeRemote}`}>Remote</span>
              )}
              {job.experience_level && (
                <span className={`${styles.badge} ${styles.badgeLevel}`}>
                  {EXPERIENCE_LEVEL_LABELS[job.experience_level]}
                </span>
              )}
            </div>

            {/* Meta grid */}
            <div className={styles.metaGrid}>
              {job.location && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Location</span>
                  <span className={styles.metaValue}>{job.location}</span>
                </div>
              )}
              {salary && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Salary</span>
                  <span className={styles.metaValue}>{salary}</span>
                </div>
              )}
              {company.industry && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Industry</span>
                  <span className={styles.metaValue}>{company.industry}</span>
                </div>
              )}
              {job.application_deadline && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Apply Before</span>
                  <span className={styles.metaValue}>
                    {new Date(job.application_deadline).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Posted</span>
                <span className={styles.metaValue}>
                  {new Date(job.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className={styles.description}>
              <h2 className={styles.sectionTitle}>Job Description</h2>
              <p className={styles.descriptionText}>{job.description}</p>
            </div>

            {/* Skills */}
            {job.required_skills.length > 0 && (
              <div className={styles.skillsSection}>
                <h2 className={styles.sectionTitle}>Required Skills</h2>
                <div className={styles.skillsList}>
                  {job.required_skills.map((skill) => (
                    <span key={skill} className={styles.skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.actionCard}>
            <p className={styles.actionTitle}>Actions</p>

            {/* Job seeker — apply */}
            {isJobSeeker && (
              <Link href={ROUTES.JOB_APPLY(job.id)} className={styles.applyButton}>
                Apply Now
              </Link>
            )}

            {/* Employer who owns this job */}
            {isOwner && (
              <>
                <Link
                  href={ROUTES.DASHBOARD_JOB_EDIT(job.id)}
                  className={styles.outlineButton}
                >
                  Edit Job
                </Link>
                <Link
                  href={ROUTES.DASHBOARD_JOB_APPLICATIONS(job.id)}
                  className={styles.outlineButton}
                >
                  View Applications
                </Link>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete Job
                </button>
              </>
            )}

            {/* Not logged in */}
            {!user && (
              <p className={styles.loginPrompt}>
                <Link href={ROUTES.LOGIN}>Sign in</Link> or{' '}
                <Link href={ROUTES.REGISTER}>create an account</Link> to apply.
              </p>
            )}

            {job.views_count > 0 && (
              <p className={styles.viewCount}>{job.views_count.toLocaleString()} views</p>
            )}
          </div>

          {/* Company card */}
          <div className={styles.actionCard}>
            <p className={styles.actionTitle}>Company</p>
            <Link href={ROUTES.COMPANY(company.slug)} className={styles.outlineButton}>
              View {company.name}
            </Link>
          </div>
        </aside>
      </div>
    </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Delete Job Posting?</h2>
            <p className={styles.modalText}>
              This will permanently remove the job posting and all associated applications. This action cannot be undone.
            </p>
            {deleteError && (
              <p style={{ color: 'var(--color-error, #dc2626)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                {deleteError}
              </p>
            )}
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => { setConfirmDelete(false); setDeleteError(''); }} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete Job'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
