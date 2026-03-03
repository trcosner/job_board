/**
 * Dashboard – My Applications (Job Seeker)
 * Lists all applications submitted by the authenticated job seeker.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';
import { getMyApplications, getApplication } from '@/lib/api/applications';
import type { ApplicationWithDetails, ApplicationStatus, ApplicationFilters } from '@/types/application';
import { APPLICATION_STATUS_LABELS, WITHDRAWABLE_STATUSES } from '@/types/application';
import { FileText, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './page.module.css';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: styles.badgeApplied ?? 'badgeApplied',
  reviewing: styles.badgeReviewing ?? 'badgeReviewing',
  interview: styles.badgeInterview ?? 'badgeInterview',
  offer: styles.badgeOffer ?? 'badgeOffer',
  hired: styles.badgeHired ?? 'badgeHired',
  rejected: styles.badgeRejected ?? 'badgeRejected',
  withdrawn: styles.badgeWithdrawn ?? 'badgeWithdrawn',
};

const STATUS_FILTERS: { value: ApplicationStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'applied', label: 'Applied' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const PAGE_SIZE = 10;

export default function MyApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('');

  useEffect(() => {
    if (!authLoading && !user) { router.push(ROUTES.LOGIN); return; }
    if (!authLoading && user?.userType !== 'job_seeker') { router.push(ROUTES.DASHBOARD); return; }
    if (!authLoading && user) fetchApplications();
  }, [user, authLoading, page, statusFilter]);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters: ApplicationFilters = { page, limit: PAGE_SIZE };
      if (statusFilter) filters.status = statusFilter;

      // Fetch list first, then enrich each with job/company via getApplication
      const listRes = await getMyApplications(filters);
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
  }, [page, statusFilter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}><div className={styles.spinner} /></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>My Applications</h1>
            <p className={styles.pageSubtitle}>
              {total} application{total !== 1 ? 's' : ''} submitted
            </p>
          </div>
          <Link href={ROUTES.JOBS}>
            <Button variant="primary">Browse Jobs</Button>
          </Link>
        </div>

        {/* Status filter */}
        <div className={styles.filters}>
          {STATUS_FILTERS.map(({ value, label }) => (
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

        {loading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : applications.length === 0 ? (
          <div className={styles.empty}>
            <FileText size={40} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No applications yet</h3>
            <p className={styles.emptyText}>
              {statusFilter
                ? `No ${APPLICATION_STATUS_LABELS[statusFilter as ApplicationStatus]} applications found.`
                : 'Start applying to jobs to see your applications here.'}
            </p>
            {!statusFilter && (
              <Link href={ROUTES.JOBS}>
                <Button variant="primary">Browse Jobs</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className={styles.list}>
              {applications.map((app) => (
                <Link
                  key={app.id}
                  href={ROUTES.DASHBOARD_APPLICATION(app.id)}
                  className={styles.card}
                >
                  {/* Company logo */}
                  <div className={styles.logo}>
                    {app.company?.logo_url ? (
                      <img src={app.company.logo_url} alt={app.company.name} className={styles.logoImg} />
                    ) : (
                      <span className={styles.logoInitials}>
                        {(app.company?.name ?? '?')[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Job info */}
                  <div className={styles.info}>
                    <h3 className={styles.jobTitle}>{app.job?.title ?? 'Job Application'}</h3>
                    <p className={styles.companyName}>{app.company?.name ?? ''}</p>
                    {app.job?.location && (
                      <p className={styles.location}>{app.job.location}</p>
                    )}
                  </div>

                  {/* Status + date */}
                  <div className={styles.meta}>
                    <span className={`${styles.badge} ${styles[`badge-${app.status}`]}`}>
                      {APPLICATION_STATUS_LABELS[app.status]}
                    </span>
                    <span className={styles.date}>
                      Applied {new Date(app.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>

                  <ExternalLink size={14} className={styles.viewIcon} />
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
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
