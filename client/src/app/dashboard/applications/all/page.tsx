'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getCompanyApplications } from '@/lib/api/companies';
import { getApplication, updateApplicationStatus } from '@/lib/api/applications';
import { getMyJobs } from '@/lib/api/jobs';
import { ROUTES } from '@/lib/constants';
import type { ApplicationWithDetails, ApplicationStatus } from '@/types/application';
import type { Job } from '@/types/job';
import { APPLICATION_STATUS_LABELS, EMPLOYER_STATUSES } from '@/types/application';
import styles from './page.module.css';

const PAGE_SIZE = 20;

const ALL_STATUSES: ApplicationStatus[] = [
  'applied',
  'reviewing',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
];

export default function CompanyApplicationsPage() {
  const router = useRouter();
  const { user, userCompany, loading } = useAuth();

  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');
  const [jobFilter, setJobFilter] = useState<string>('');
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // --- Auth guards ---
  useEffect(() => {
    if (!loading && !user) router.push(ROUTES.LOGIN);
    if (!loading && user && user.userType !== 'employer')
      router.push(ROUTES.DASHBOARD);
    if (!loading && user && user.userType === 'employer' && !userCompany)
      router.push(ROUTES.ONBOARDING_COMPANY);
  }, [loading, user, userCompany, router]);

  // --- Load company jobs for filter dropdown ---
  useEffect(() => {
    if (!userCompany) return;
    getMyJobs({ limit: 200 })
      .then((res) => setJobs(res.data ?? []))
      .catch(() => {/* non-fatal */});
  }, [userCompany]);

  // --- Fetch applications ---
  const fetchApplications = useCallback(async () => {
    if (!userCompany) return;
    setFetching(true);
    setError(null);
    try {
      const filters = {
        page,
        limit: PAGE_SIZE,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(jobFilter ? { job_id: jobFilter } : {}),
      };
      const res = await getCompanyApplications(userCompany.id, filters);
      const items = res.data ?? [];
      setTotal(res.pagination?.total ?? 0);

      // Enrich each application with job / company / applicant data
      const enriched = await Promise.all(items.map((a) => getApplication(a.id)));
      setApplications(enriched.map((r) => r.application));
    } catch {
      setError('Failed to load applications. Please try again.');
    } finally {
      setFetching(false);
    }
  }, [userCompany, page, statusFilter, jobFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // --- Status change ---
  async function handleStatusChange(appId: string, newStatus: ApplicationStatus) {
    setUpdatingId(appId);
    try {
      await updateApplicationStatus(appId, { status: newStatus });
      // Update in local state
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
    } catch {
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  // --- Filter helpers ---
  function handleStatusFilter(s: ApplicationStatus | '') {
    setStatusFilter(s);
    setPage(1);
  }

  function handleJobFilter(e: React.ChangeEvent<HTMLSelectElement>) {
    setJobFilter(e.target.value);
    setPage(1);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const terminalStatuses: ApplicationStatus[] = ['hired', 'rejected', 'withdrawn'];

  if (!loading && (!user || user.userType !== 'employer' || !userCompany)) return null;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>All Applications</h1>
            <p className={styles.pageSubtitle}>
              {total} application{total !== 1 ? 's' : ''} across all jobs at{' '}
              {userCompany?.name}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filterRow}>
          {/* Job filter */}
          <div className={styles.filterGroup}>
            <label htmlFor="job-filter" className={styles.filterLabel}>
              Job
            </label>
            <select
              id="job-filter"
              className={styles.jobSelect}
              value={jobFilter}
              onChange={handleJobFilter}
            >
              <option value="">All Jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter tabs */}
          <div className={styles.statusTabs}>
            <button
              className={`${styles.filterBtn} ${statusFilter === '' ? styles.filterBtnActive : ''}`}
              onClick={() => handleStatusFilter('')}
            >
              All
            </button>
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                className={`${styles.filterBtn} ${statusFilter === s ? styles.filterBtnActive : ''}`}
                onClick={() => handleStatusFilter(s)}
              >
                {APPLICATION_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && <div className={styles.errorMsg}>{error}</div>}

        {/* Table */}
        {fetching ? (
          <div className={styles.loading}>Loading applications…</div>
        ) : applications.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No applications found</p>
            <p className={styles.emptySubtitle}>
              {statusFilter || jobFilter
                ? 'Try clearing the filters.'
                : 'Applications will appear here once candidates apply to your jobs.'}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Job</th>
                    <th>Applied</th>
                    <th>Status</th>
                    <th>Update Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const isTerminal = terminalStatuses.includes(app.status);
                    return (
                      <tr key={app.id}>
                        {/* Applicant */}
                        <td>
                          <div className={styles.applicantCell}>
                            <div className={styles.avatar}>
                              {app.applicant.first_name[0]}
                              {app.applicant.last_name[0]}
                            </div>
                            <div>
                              <div className={styles.applicantName}>
                                {app.applicant.first_name} {app.applicant.last_name}
                              </div>
                              <div className={styles.applicantEmail}>
                                {app.applicant.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Job */}
                        <td>
                          <Link
                            href={ROUTES.DASHBOARD_JOB_APPLICATIONS(app.job.id)}
                            className={styles.jobLink}
                          >
                            {app.job.title}
                          </Link>
                        </td>

                        {/* Applied date */}
                        <td className={styles.dateCell}>
                          {new Date(app.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        {/* Status badge */}
                        <td>
                          <span className={`${styles.badge} ${styles[`badge-${app.status}`]}`}>
                            {APPLICATION_STATUS_LABELS[app.status]}
                          </span>
                        </td>

                        {/* Inline status update */}
                        <td>
                          {isTerminal ? (
                            <span className={styles.terminalNote}>—</span>
                          ) : (
                            <select
                              className={styles.statusSelect}
                              value={app.status}
                              disabled={updatingId === app.id}
                              onChange={(e) =>
                                handleStatusChange(app.id, e.target.value as ApplicationStatus)
                              }
                            >
                              <option value={app.status} disabled>
                                {APPLICATION_STATUS_LABELS[app.status]}
                              </option>
                              {EMPLOYER_STATUSES.filter((s) => s !== app.status).map((s) => (
                                <option key={s} value={s}>
                                  → {APPLICATION_STATUS_LABELS[s]}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>

                        {/* Actions */}
                        <td>
                          <Link
                            href={`${ROUTES.DASHBOARD_JOB_APPLICATIONS(app.job.id)}/${app.id}`}
                            className={styles.viewBtn}
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className={styles.pageBtn}
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
