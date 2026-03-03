/**
 * Dashboard – Application Detail (Job Seeker)
 * Shows full details of a single application with status timeline.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ROUTES } from '@/lib/constants';
import {
  getApplication,
  getApplicationHistory,
  getResumeUrl,
  withdrawApplication,
} from '@/lib/api/applications';
import type { ApplicationWithDetails, ApplicationStatusHistory } from '@/types/application';
import {
  APPLICATION_STATUS_LABELS,
  WITHDRAWABLE_STATUSES,
} from '@/types/application';
import {
  ArrowLeft,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Briefcase,
  Building2,
} from 'lucide-react';
import styles from './page.module.css';

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'hired':
    case 'offer':
      return <CheckCircle2 size={16} className={styles.iconSuccess} />;
    case 'rejected':
    case 'withdrawn':
      return <XCircle size={16} className={styles.iconError} />;
    case 'interview':
      return <Briefcase size={16} className={styles.iconAccent} />;
    default:
      return <Clock size={16} className={styles.iconMuted} />;
  }
}

export default function ApplicationDetailPage() {
  const { id: applicationId } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [application, setApplication] = useState<ApplicationWithDetails | null>(null);
  const [history, setHistory] = useState<ApplicationStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawConfirm, setWithdrawConfirm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push(ROUTES.LOGIN); return; }
    if (!authLoading && user) fetchData();
  }, [user, authLoading, applicationId]);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const [appRes, histRes] = await Promise.all([
        getApplication(applicationId),
        getApplicationHistory(applicationId),
      ]);
      setApplication(appRes.application);
      setHistory(histRes.history);
    } catch {
      setError('Application not found or access denied.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadResume() {
    try {
      const res = await getResumeUrl(applicationId);
      window.open(res.resumeUrl, '_blank');
    } catch {
      // silently fail, link already shown
    }
  }

  async function handleWithdraw() {
    setWithdrawing(true);
    try {
      await withdrawApplication(applicationId);
      setWithdrawConfirm(false);
      await fetchData();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to withdraw application.');
    } finally {
      setWithdrawing(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}><div className={styles.spinner} /></div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Alert variant="error">{error || 'Application not found.'}</Alert>
          <Link href={ROUTES.DASHBOARD_APPLICATIONS}>
            <Button variant="outline">Back to Applications</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canWithdraw = (WITHDRAWABLE_STATUSES as string[]).includes(application.status);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Back */}
        <Link href={ROUTES.DASHBOARD_APPLICATIONS} className={styles.back}>
          <ArrowLeft size={16} />
          Back to Applications
        </Link>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>{application.job?.title ?? 'Application'}</h1>
            {application.company && (
              <p className={styles.companyRow}>
                <Building2 size={14} />
                {application.company.name}
              </p>
            )}
          </div>
          <span className={`${styles.statusBadge} ${styles[`badge-${application.status}`]}`}>
            {APPLICATION_STATUS_LABELS[application.status]}
          </span>
        </div>

        <div className={styles.grid}>
          {/* Main column */}
          <div className={styles.main}>
            {/* Status timeline */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Application Timeline</h2>
              {history.length === 0 ? (
                <p className={styles.noHistory}>No status changes recorded yet.</p>
              ) : (
                <ol className={styles.timeline}>
                  {history.map((entry, idx) => (
                    <li key={entry.id} className={`${styles.timelineItem} ${idx === 0 ? styles.timelineItemLatest : ''}`}>
                      <div className={styles.timelineDot}>
                        <StatusIcon status={entry.to_status} />
                      </div>
                      <div className={styles.timelineBody}>
                        <div className={styles.timelineStatus}>
                          {APPLICATION_STATUS_LABELS[entry.to_status]}
                          {entry.from_status && (
                            <span className={styles.timelineFrom}>
                              {' '}from {APPLICATION_STATUS_LABELS[entry.from_status]}
                            </span>
                          )}
                        </div>
                        <div className={styles.timelineMeta}>
                          {new Date(entry.created_at).toLocaleDateString('en-US', {
                            month: 'long', day: 'numeric', year: 'numeric',
                          })}
                          {entry.changed_by_user && (
                            <span> · by {entry.changed_by_user.first_name} {entry.changed_by_user.last_name}</span>
                          )}
                        </div>
                        {entry.notes && (
                          <p className={styles.timelineNotes}>{entry.notes}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* Cover letter */}
            {application.cover_letter && (
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Cover Letter</h2>
                <p className={styles.coverLetter}>{application.cover_letter}</p>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {/* Actions */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Actions</h2>
              <div className={styles.sidebarActions}>
                <button className={styles.downloadBtn} onClick={handleDownloadResume}>
                  <Download size={15} />
                  Download Resume
                </button>
                {application.job && (
                  <Link href={ROUTES.JOB(application.job.id)}>
                    <Button variant="outline" fullWidth>View Job Listing</Button>
                  </Link>
                )}
                {canWithdraw && !withdrawConfirm && (
                  <Button variant="danger" onClick={() => setWithdrawConfirm(true)} fullWidth>
                    Withdraw Application
                  </Button>
                )}
                {withdrawConfirm && (
                  <div className={styles.withdrawConfirm}>
                    <p><AlertCircle size={14} /> Are you sure? This cannot be undone.</p>
                    <div className={styles.withdrawActions}>
                      <Button
                        variant="danger"
                        onClick={handleWithdraw}
                        disabled={withdrawing}
                      >
                        {withdrawing ? 'Withdrawing...' : 'Yes, Withdraw'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setWithdrawConfirm(false)}
                        disabled={withdrawing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Supplemental info */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Application Details</h2>
              <dl className={styles.detailList}>
                <div className={styles.detailRow}>
                  <dt>Applied</dt>
                  <dd>{new Date(application.created_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}</dd>
                </div>
                {application.phone && (
                  <div className={styles.detailRow}>
                    <dt>Phone</dt>
                    <dd>{application.phone}</dd>
                  </div>
                )}
                {application.linkedin_url && (
                  <div className={styles.detailRow}>
                    <dt>LinkedIn</dt>
                    <dd>
                      <a href={application.linkedin_url} target="_blank" rel="noreferrer">
                        View Profile
                      </a>
                    </dd>
                  </div>
                )}
                {application.portfolio_url && (
                  <div className={styles.detailRow}>
                    <dt>Portfolio</dt>
                    <dd>
                      <a href={application.portfolio_url} target="_blank" rel="noreferrer">
                        View Portfolio
                      </a>
                    </dd>
                  </div>
                )}
                {application.years_experience !== null && (
                  <div className={styles.detailRow}>
                    <dt>Experience</dt>
                    <dd>{application.years_experience} yr{application.years_experience !== 1 ? 's' : ''}</dd>
                  </div>
                )}
                {application.current_title && (
                  <div className={styles.detailRow}>
                    <dt>Current Title</dt>
                    <dd>{application.current_title}</dd>
                  </div>
                )}
                {application.current_company && (
                  <div className={styles.detailRow}>
                    <dt>Current Company</dt>
                    <dd>{application.current_company}</dd>
                  </div>
                )}
                {application.expected_salary !== null && (
                  <div className={styles.detailRow}>
                    <dt>Expected Salary</dt>
                    <dd>${application.expected_salary?.toLocaleString()}</dd>
                  </div>
                )}
                {application.availability && (
                  <div className={styles.detailRow}>
                    <dt>Availability</dt>
                    <dd>{application.availability}</dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
