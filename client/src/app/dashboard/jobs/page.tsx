'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { getMyJobs, deleteJob, updateJobStatus } from '@/lib/api';
import type { Job, JobStatus } from '@/types/job';
import { JOB_TYPE_LABELS } from '@/types/job';
import { ROUTES } from '@/lib/constants';
import styles from './page.module.css';

type TabStatus = 'active' | 'draft' | 'closed';

const TABS: { label: string; value: TabStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Closed', value: 'closed' },
];

const PAGE_SIZE = 20;

export default function DashboardJobsPage() {
  const { user, onboardingComplete, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<TabStatus>('active');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [counts, setCounts] = useState<Record<TabStatus, number>>({
    active: 0,
    draft: 0,
    closed: 0,
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace(ROUTES.LOGIN); return; }
    if (user.userType !== 'employer') { router.replace(ROUTES.DASHBOARD); return; }
    if (!onboardingComplete) { router.replace(ROUTES.ONBOARDING_COMPANY); }
  }, [authLoading, user, onboardingComplete, router]);

  const fetchJobs = useCallback(
    async (status: TabStatus, activePage: number) => {
      setLoadingJobs(true);
      try {
        const result = await getMyJobs({ status, page: activePage, limit: PAGE_SIZE });
        setJobs(result.data);
        setTotal(result.pagination.total);
        // Refresh counts for all tabs
        const [activeRes, draftRes, closedRes] = await Promise.all([
          getMyJobs({ status: 'active', page: 1, limit: 1 }),
          getMyJobs({ status: 'draft', page: 1, limit: 1 }),
          getMyJobs({ status: 'closed', page: 1, limit: 1 }),
        ]);
        setCounts({
          active: activeRes.pagination.total,
          draft: draftRes.pagination.total,
          closed: closedRes.pagination.total,
        });
      } finally {
        setLoadingJobs(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!authLoading && user?.userType === 'employer' && onboardingComplete) {
      fetchJobs(tab, page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, onboardingComplete]);

  function handleTabChange(newTab: TabStatus) {
    setTab(newTab);
    setPage(1);
    fetchJobs(newTab, 1);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    fetchJobs(tab, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handlePublish(jobId: string) {
    setPublishingId(jobId);
    try {
      await updateJobStatus(jobId, 'active');
      fetchJobs(tab, page);
    } finally {
      setPublishingId(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!confirmDeleteId) return;
    const idToDelete = confirmDeleteId;
    setDeletingId(idToDelete);
    setConfirmDeleteId(null);
    setDeleteError('');
    try {
      await deleteJob(idToDelete);
      fetchJobs(tab, page);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete job. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  const isLoading = authLoading;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function statusBadgeClass(status: JobStatus): string {
    if (status === 'active') return styles.statusActive;
    if (status === 'draft') return styles.statusDraft;
    return styles.statusClosed;
  }

  if (isLoading) {
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
    <>
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Page header */}
          <div className={styles.pageHeader}>
            <div className={styles.headerLeft}>
              <h1 className={styles.pageTitle}>My Jobs</h1>
              <p className={styles.pageSubtitle}>Manage your job postings</p>
            </div>
            <Link href={ROUTES.DASHBOARD_JOB_NEW} className={styles.newJobButton}>
              + Post a Job
            </Link>
          </div>

          {/* Tabs */}
          <div className={styles.tabs} role="tablist">
            {TABS.map(({ label, value }) => (
              <button
                key={value}
                role="tab"
                aria-selected={tab === value}
                className={`${styles.tab}${tab === value ? ` ${styles.tabActive}` : ''}`}
                onClick={() => handleTabChange(value)}
              >
                {label}
                <span className={styles.tabCount}>{counts[value]}</span>
              </button>
            ))}
          </div>

          {/* Job list */}
          {loadingJobs ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
              <div className={styles.spinner} style={{ margin: '0 auto' }} aria-label="Loading jobs" />
            </div>
          ) : jobs.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No {tab} jobs</p>
              <p className={styles.emptyText}>
                {tab === 'active'
                  ? 'Post your first job to attract candidates.'
                  : tab === 'draft'
                    ? 'Draft jobs will appear here until published.'
                    : 'Closed jobs will be archived here.'}
              </p>
              {tab !== 'closed' && (
                <Link href={ROUTES.DASHBOARD_JOB_NEW} className={styles.newJobButton}>
                  + Post a Job
                </Link>
              )}
            </div>
          ) : (
            <div className={styles.jobTable}>
              {jobs.map((job) => (
                <div key={job.id} className={styles.jobRow}>
                  {/* Job info */}
                  <div className={styles.jobInfo}>
                    <Link
                      href={ROUTES.JOB(job.id)}
                      className={styles.jobTitle}
                    >
                      {job.title}
                    </Link>
                    <div className={styles.jobMeta}>
                      <span className={styles.jobMetaItem}>
                        {JOB_TYPE_LABELS[job.job_type]}
                      </span>
                      {job.location && (
                        <span className={styles.jobMetaItem}>{job.location}</span>
                      )}
                      {job.remote && (
                        <span className={styles.jobMetaItem}>Remote</span>
                      )}
                      <span className={styles.jobMetaItem}>
                        {new Date(job.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`${styles.statusBadge} ${statusBadgeClass(job.status)}`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>

                  {/* Applications count */}
                  <div className={styles.appCount}>
                    <Link
                      href={ROUTES.DASHBOARD_JOB_APPLICATIONS(job.id)}
                      className={styles.appCountLink}
                    >
                      {job.views_count} view{job.views_count !== 1 ? 's' : ''}
                    </Link>
                  </div>

                  {/* Row actions */}
                  <div className={styles.rowActions}>
                    {job.status === 'draft' && (
                      <button
                        type="button"
                        className={`${styles.actionLink} ${styles.actionLinkSuccess}`}
                        title="Publish job"
                        onClick={() => handlePublish(job.id)}
                        disabled={publishingId === job.id}
                      >
                        <svg
                          className={styles.actionIcon}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M22 2L11 13" />
                          <path d="M22 2L15 22 11 13 2 9l20-7z" />
                        </svg>
                      </button>
                    )}
                    <Link
                      href={ROUTES.DASHBOARD_JOB_EDIT(job.id)}
                      className={styles.actionLink}
                      title="Edit job"
                    >
                      <svg
                        className={styles.actionIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Link>
                    <Link
                      href={ROUTES.DASHBOARD_JOB_APPLICATIONS(job.id)}
                      className={styles.actionLink}
                      title="View applications"
                    >
                      <svg
                        className={styles.actionIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </Link>
                    <button
                      type="button"
                      className={`${styles.actionLink} ${styles.actionLinkDanger}`}
                      title="Delete job"
                      onClick={() => setConfirmDeleteId(job.id)}
                      disabled={deletingId === job.id}
                    >
                      <svg
                        className={styles.actionIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loadingJobs && totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Pagination">
              <button
                className={styles.pageButton}
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`${styles.pageButton}${p === page ? ` ${styles.pageButtonActive}` : ''}`}
                  onClick={() => handlePageChange(p)}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}
              <button
                className={styles.pageButton}
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                ›
              </button>
            </nav>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteError && !confirmDeleteId && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--color-error-bg, #fef2f2)', border: '1px solid var(--color-error, #dc2626)', color: 'var(--color-error, #dc2626)', borderRadius: '0.5rem', padding: '0.75rem 1.25rem', zIndex: 50, maxWidth: '28rem', textAlign: 'center' }}>
          {deleteError}
          <button onClick={() => setDeleteError('')} style={{ marginLeft: '1rem', fontWeight: 600 }} aria-label="Dismiss">✕</button>
        </div>
      )}

      {confirmDeleteId && (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Delete Job Posting?</h2>
            <p className={styles.modalText}>
              This will permanently remove the job posting. Applications linked to this
              job will also be deleted. This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm}>
                Delete Job
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
