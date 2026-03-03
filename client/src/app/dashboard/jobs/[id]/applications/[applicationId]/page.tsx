/**
 * Dashboard – Employer Application Review
 * Full application details with status management and notes.
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
  updateApplicationStatus,
} from '@/lib/api/applications';
import type { ApplicationWithDetails, ApplicationStatusHistory, ApplicationStatus } from '@/types/application';
import {
  APPLICATION_STATUS_LABELS,
  EMPLOYER_STATUSES,
} from '@/types/application';
import { ArrowLeft, Download, Clock, CheckCircle2, XCircle, Briefcase } from 'lucide-react';
import styles from './page.module.css';

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'hired': case 'offer':
      return <CheckCircle2 size={15} className={styles.iconSuccess} />;
    case 'rejected': case 'withdrawn':
      return <XCircle size={15} className={styles.iconError} />;
    case 'interview':
      return <Briefcase size={15} className={styles.iconAccent} />;
    default:
      return <Clock size={15} className={styles.iconMuted} />;
  }
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: 'badge-applied',
  reviewing: 'badge-reviewing',
  interview: 'badge-interview',
  offer: 'badge-offer',
  hired: 'badge-hired',
  rejected: 'badge-rejected',
  withdrawn: 'badge-withdrawn',
};

export default function EmployerApplicationReviewPage() {
  const { id: jobId, applicationId } = useParams<{ id: string; applicationId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [application, setApplication] = useState<ApplicationWithDetails | null>(null);
  const [history, setHistory] = useState<ApplicationStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push(ROUTES.LOGIN); return; }
    if (!authLoading && user?.userType !== 'employer') { router.push(ROUTES.DASHBOARD); return; }
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

  async function handleStatusChange(newStatus: ApplicationStatus, actionNotes?: string) {
    if (!application) return;
    setStatusUpdating(true);
    setError('');
    try {
      const res = await updateApplicationStatus(applicationId, {
        status: newStatus,
        notes: actionNotes,
      });
      setApplication((prev) => prev ? { ...prev, status: res.application.status } : null);
      // Refresh history
      const histRes = await getApplicationHistory(applicationId);
      setHistory(histRes.history);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleDownloadResume() {
    try {
      const res = await getResumeUrl(applicationId);
      window.open(res.resumeUrl, '_blank');
    } catch {
      setError('Could not retrieve resume download link.');
    }
  }

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCenter}><div className={styles.spinner} /></div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Alert variant="error">{error}</Alert>
          <Link href={ROUTES.DASHBOARD_JOB_APPLICATIONS(jobId)}>
            <Button variant="outline">Back to Applications</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!application) return null;

  const isTerminal = ['hired', 'rejected', 'withdrawn'].includes(application.status);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Back */}
        <Link href={ROUTES.DASHBOARD_JOB_APPLICATIONS(jobId)} className={styles.back}>
          <ArrowLeft size={16} />
          Back to Applications
        </Link>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>
              {application.applicant
                ? `${application.applicant.first_name} ${application.applicant.last_name}`
                : 'Applicant'}
            </h1>
            <p className={styles.pageSubtitle}>
              Applied for <strong>{application.job?.title ?? 'this position'}</strong>
            </p>
          </div>
          <span className={`${styles.statusBadge} ${styles[STATUS_COLORS[application.status]]}`}>
            {APPLICATION_STATUS_LABELS[application.status]}
          </span>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className={styles.grid}>
          {/* Main */}
          <div className={styles.main}>
            {/* Move to next stage (quick actions) */}
            {!isTerminal && (
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Move to Stage</h2>
                <div className={styles.stageButtons}>
                  {EMPLOYER_STATUSES.filter((s) => s !== application.status).map((s) => (
                    <button
                      key={s}
                      className={`${styles.stageBtn} ${s === 'rejected' ? styles.stageBtnDanger : ''}`}
                      disabled={statusUpdating}
                      onClick={() => handleStatusChange(s)}
                    >
                      {APPLICATION_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Timeline */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Application Timeline</h2>
              {history.length === 0 ? (
                <p className={styles.noData}>No status changes recorded yet.</p>
              ) : (
                <ol className={styles.timeline}>
                  {history.map((entry, idx) => (
                    <li key={entry.id} className={`${styles.timelineItem} ${idx === 0 ? styles.timelineLatest : ''}`}>
                      <div className={styles.dot}>
                        <StatusIcon status={entry.to_status} />
                      </div>
                      <div className={styles.timelineBody}>
                        <div className={styles.timelineStatus}>
                          {APPLICATION_STATUS_LABELS[entry.to_status]}
                          {entry.from_status && (
                            <span className={styles.timelineFrom}> from {APPLICATION_STATUS_LABELS[entry.from_status]}</span>
                          )}
                        </div>
                        <div className={styles.timelineMeta}>
                          {new Date(entry.created_at).toLocaleDateString('en-US', {
                            month: 'long', day: 'numeric', year: 'numeric',
                          })}
                          {entry.changed_by_user && <span> · {entry.changed_by_user.first_name} {entry.changed_by_user.last_name}</span>}
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

            {/* Internal notes */}
            {!isTerminal && (
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>Internal Notes</h2>
                <p className={styles.notesHint}>Notes are visible only to your team and are not shown to the applicant.</p>
                <textarea
                  className={styles.notesTextarea}
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setNotesSaved(false); }}
                  placeholder="Add notes about this candidate..."
                  rows={4}
                />
                <div className={styles.notesActions}>
                  {notesSaved && <span className={styles.saved}>Saved</span>}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!notes.trim() || statusUpdating}
                    onClick={() => handleStatusChange(application.status, notes)}
                  >
                    Save Note
                  </Button>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {/* Resume */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Resume</h2>
              <button className={styles.downloadBtn} onClick={handleDownloadResume}>
                <Download size={15} />
                Download {application.resume_filename ?? 'Resume'}
              </button>
            </div>

            {/* Applicant details */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Applicant</h2>
              <dl className={styles.detailList}>
                {application.applicant && (
                  <>
                    <div className={styles.detailRow}>
                      <dt>Name</dt>
                      <dd>{application.applicant.first_name} {application.applicant.last_name}</dd>
                    </div>
                    <div className={styles.detailRow}>
                      <dt>Email</dt>
                      <dd>
                        <a href={`mailto:${application.applicant.email}`}>
                          {application.applicant.email}
                        </a>
                      </dd>
                    </div>
                  </>
                )}
                {application.phone && (
                  <div className={styles.detailRow}>
                    <dt>Phone</dt>
                    <dd><a href={`tel:${application.phone}`}>{application.phone}</a></dd>
                  </div>
                )}
                {application.linkedin_url && (
                  <div className={styles.detailRow}>
                    <dt>LinkedIn</dt>
                    <dd><a href={application.linkedin_url} target="_blank" rel="noreferrer">View Profile</a></dd>
                  </div>
                )}
                {application.portfolio_url && (
                  <div className={styles.detailRow}>
                    <dt>Portfolio</dt>
                    <dd><a href={application.portfolio_url} target="_blank" rel="noreferrer">View Portfolio</a></dd>
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
                {application.expected_salary !== null && application.expected_salary !== undefined && (
                  <div className={styles.detailRow}>
                    <dt>Expected Salary</dt>
                    <dd>${application.expected_salary.toLocaleString()}</dd>
                  </div>
                )}
                {application.availability && (
                  <div className={styles.detailRow}>
                    <dt>Availability</dt>
                    <dd>{application.availability}</dd>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <dt>Applied</dt>
                  <dd>{new Date(application.created_at).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
