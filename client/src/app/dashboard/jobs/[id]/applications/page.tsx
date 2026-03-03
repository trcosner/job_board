/**
 * Dashboard – Job Applications Pipeline (Employer)
 * Lists all applications for a specific job with status pipeline view.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ROUTES } from '@/lib/constants';
import { getJob, getJobApplications, getJobApplicationStats } from '@/lib/api/jobs';
import { getApplication, updateApplicationStatus } from '@/lib/api/applications';
import type { JobWithCompany } from '@/types/job';
import type {
  ApplicationWithDetails,
  ApplicationStatus,
  ApplicationStats,
  ApplicationFilters,
  UpdateApplicationStatusData,
} from '@/types/application';
import { APPLICATION_STATUS_LABELS, EMPLOYER_STATUSES } from '@/types/application';
import { ArrowLeft, ChevronLeft, ChevronRight, User } from 'lucide-react';
import styles from './page.module.css';

const PIPELINE_STATUSES: { value: ApplicationStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'applied', label: 'Applied' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
];

const PAGE_SIZE = 15;

export default function JobApplicationsPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<JobWithCompany | null>(null);
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) { router.push(ROUTES.LOGIN); return; }
    if (!authLoading && user?.userType !== 'employer') { router.push(ROUTES.DASHBOARD); return; }
    if (!authLoading && user) loadAll();
  }, [user, authLoading]);

  useEffect(() => {
    if (job) fetchApplications();
  }, [page, statusFilter, job]);

  async function loadAll() {
    try {
      const [jobRes, statsRes] = await Promise.all([
        getJob(jobId),
        getJobApplicationStats(jobId),
      ]);
      setJob(jobRes.job);
      setStats(statsRes.stats);
    } catch {
      setError('Job not found or access denied.');
      setLoading(false);
    }
  }

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters: ApplicationFilters = { page, limit: PAGE_SIZE };
      if (statusFilter) filters.status = statusFilter;

      const listRes = await getJobApplications(jobId, filters);
      setTotal(listRes.pagination.total);

      const enriched = await Promise.all(
        listRes.data.map(async (app) => {
          try {
            const detail = await getApplication(app.id);
            return detail.application;
          } catch {
            return app as unknown as ApplicationWithDetails;
          }
        })
      );
      setApplications(enriched);
    } catch {
      setError('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [jobId, page, statusFilter]);

  async function handleStatusChange(applicationId: string, newStatus: ApplicationStatus) {
    setStatusUpdating(applicationId);
    try {
      await updateApplicationStatus(applicationId, { status: newStatus } as UpdateApplicationStatusData);
      // Optimistic update
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
      );
      // Refresh stats
      const statsRes = await getJobApplicationStats(jobId);
      setStats(statsRes.stats);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to update status.');
    } finally {
      setStatusUpdating(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}><div className={styles.spinner} /></div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Alert variant="error">{error}</Alert>
          <Link href={ROUTES.DASHBOARD_JOBS}><Button variant="outline">Back to Jobs</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Back */}
        <Link href={ROUTES.DASHBOARD_JOBS} className={styles.back}>
          <ArrowLeft size={16} />
          Back to My Jobs
        </Link>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>{job?.title ?? 'Applications'}</h1>
            <p className={styles.pageSubtitle}>Review and manage candidates</p>
          </div>
          {job && (
            <Link href={ROUTES.DASHBOARD_JOB_EDIT(jobId)}>
              <Button variant="outline">Edit Job</Button>
            </Link>
          )}
        </div>

        {/* Pipeline stats */}
        {stats && (
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{stats.total_applications}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{stats.reviewing_count}</span>
              <span className={styles.statLabel}>Reviewing</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{stats.interviewing_count ?? 0}</span>
              <span className={styles.statLabel}>Interview</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{stats.offered_count}</span>
              <span className={styles.statLabel}>Offer</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{stats.hired_count}</span>
              <span className={styles.statLabel}>Hired</span>
            </div>
          </div>
        )}

        {/* Status filter */}
        <div className={styles.filters}>
          {PIPELINE_STATUSES.map(({ value, label }) => (
            <button
              key={value}
              className={`${styles.filterBtn} ${statusFilter === value ? styles.filterBtnActive : ''}`}
              onClick={() => { setStatusFilter(value); setPage(1); }}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {/* Table */}
        {loading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : applications.length === 0 ? (
          <div className={styles.empty}>
            <User size={36} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No applications yet</h3>
            <p className={styles.emptyText}>
              {statusFilter
                ? `No ${APPLICATION_STATUS_LABELS[statusFilter as ApplicationStatus]} applications.`
                : 'Applications will appear here once candidates start applying.'}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>Applicant</span>
                <span>Applied</span>
                <span>Experience</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {applications.map((app) => (
                <div key={app.id} className={styles.tableRow}>
                  {/* Applicant */}
                  <div className={styles.applicantCell}>
                    <div className={styles.applicantAvatar}>
                      {((app.applicant?.first_name?.[0] ?? '') + (app.applicant?.last_name?.[0] ?? '')).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className={styles.applicantName}>
                        {app.applicant
                          ? `${app.applicant.first_name} ${app.applicant.last_name}`
                          : 'Applicant'}
                      </p>
                      <p className={styles.applicantEmail}>{app.applicant?.email ?? ''}</p>
                    </div>
                  </div>

                  {/* Applied date */}
                  <span className={styles.tableCell}>
                    {new Date(app.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric',
                    })}
                  </span>

                  {/* Experience */}
                  <span className={styles.tableCell}>
                    {app.years_experience !== null ? `${app.years_experience} yr${app.years_experience !== 1 ? 's' : ''}` : '—'}
                  </span>

                  {/* Status */}
                  <span className={styles.tableCell}>
                    <span className={`${styles.badge} ${styles[`badge-${app.status}`]}`}>
                      {APPLICATION_STATUS_LABELS[app.status]}
                    </span>
                  </span>

                  {/* Actions */}
                  <div className={styles.rowActions}>
                    <Link
                      href={`${ROUTES.DASHBOARD_JOB_APPLICATIONS(jobId)}/${app.id}`}
                      className={styles.viewLink}
                    >
                      View
                    </Link>
                    {app.status !== 'hired' && app.status !== 'rejected' && app.status !== 'withdrawn' && (
                      <select
                        className={styles.statusSelect}
                        value={app.status}
                        disabled={statusUpdating === app.id}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                        aria-label={`Change status for ${app.applicant?.first_name ?? 'applicant'}`}
                      >
                        <option value={app.status} disabled>{APPLICATION_STATUS_LABELS[app.status]}</option>
                        {EMPLOYER_STATUSES.filter((s) => s !== app.status).map((s) => (
                          <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
