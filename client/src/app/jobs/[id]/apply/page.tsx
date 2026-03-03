'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { ROUTES } from '@/lib/constants';
import { getJob, applyToJob } from '@/lib/api/jobs';
import { getMyApplications } from '@/lib/api/applications';
import type { JobWithCompany } from '@/types/job';
import { Upload, FileText, X, ArrowLeft } from 'lucide-react';
import styles from './page.module.css';

const ACCEPTED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_MB = 10;

export default function ApplyPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<JobWithCompany | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Form state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [availability, setAvailability] = useState('');

  const [fileError, setFileError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(`/jobs/${jobId}/apply`)}`);
      return;
    }
    if (!authLoading && user?.userType !== 'job_seeker') {
      router.push(ROUTES.JOB(jobId));
      return;
    }
    if (!authLoading && user) {
      loadJob();
    }
  }, [user, authLoading, jobId]);

  async function loadJob() {
    try {
      setLoadingJob(true);
      const [jobRes, appsRes] = await Promise.all([
        getJob(jobId),
        getMyApplications({ job_id: jobId, limit: 1 }),
      ]);
      setJob(jobRes.job);
      if (appsRes.data.length > 0) setAlreadyApplied(true);
    } catch {
      // job not found — router will handle 404 display
    } finally {
      setLoadingJob(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError('');

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Only PDF, DOC, or DOCX files are accepted.');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`File must be smaller than ${MAX_FILE_MB} MB.`);
      return;
    }
    setResumeFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileChange(fakeEvent);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeFile) {
      setFileError('Please upload your resume.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await applyToJob(
        jobId,
        {
          cover_letter: coverLetter || undefined,
          phone: phone || undefined,
          linkedin_url: linkedin || undefined,
          portfolio_url: portfolio || undefined,
          years_experience: yearsExp ? Number(yearsExp) : undefined,
          current_company: currentCompany || undefined,
          current_title: currentTitle || undefined,
          expected_salary: expectedSalary ? Number(expectedSalary) : undefined,
          availability: availability || undefined,
        },
        resumeFile
      );
      router.push(`${ROUTES.JOB(jobId)}?applied=1`);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 409) {
        setAlreadyApplied(true);
      } else {
        setSubmitError(e?.message ?? 'Submission failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loadingJob) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Alert variant="error">Job not found.</Alert>
          <Link href={ROUTES.JOBS}><Button variant="outline">Back to Jobs</Button></Link>
        </div>
      </div>
    );
  }

  if (alreadyApplied) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.alreadyApplied}>
            <div className={styles.alreadyAppliedIcon}>
              <FileText size={32} />
            </div>
            <h2 className={styles.alreadyAppliedTitle}>Already Applied</h2>
            <p className={styles.alreadyAppliedText}>
              You&apos;ve already submitted an application for <strong>{job.title}</strong>.
              You can track its status in your applications dashboard.
            </p>
            <div className={styles.alreadyAppliedActions}>
              <Link href={ROUTES.DASHBOARD_APPLICATIONS}>
                <Button variant="primary">View My Applications</Button>
              </Link>
              <Link href={ROUTES.JOB(jobId)}>
                <Button variant="outline">Back to Job</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const companyName = 'company' in job ? (job as JobWithCompany & { company: { name: string } }).company?.name : '';

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Back link */}
        <Link href={ROUTES.JOB(jobId)} className={styles.back}>
          <ArrowLeft size={16} />
          Back to job
        </Link>

        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Apply for {job.title}</h1>
          {companyName && (
            <p className={styles.company}>{companyName}</p>
          )}
        </div>

        {submitError && <Alert variant="error">{submitError}</Alert>}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* Resume Upload */}
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>
              Resume <span className={styles.required}>*</span>
            </legend>

            <label
              className={`${styles.dropzone} ${resumeFile ? styles.dropzoneFilled : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              htmlFor="resume-input"
            >
              {resumeFile ? (
                <div className={styles.filePreview}>
                  <FileText size={20} />
                  <span className={styles.fileName}>{resumeFile.name}</span>
                  <button
                    type="button"
                    className={styles.clearFile}
                    onClick={(e) => { e.preventDefault(); setResumeFile(null); }}
                    aria-label="Remove file"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className={styles.dropzoneInner}>
                  <Upload size={24} className={styles.uploadIcon} />
                  <p className={styles.dropzoneLabel}>
                    Drag & drop or <span className={styles.dropzoneCta}>browse</span>
                  </p>
                  <p className={styles.dropzoneHint}>PDF, DOC, DOCX · max {MAX_FILE_MB} MB</p>
                </div>
              )}
              <input
                id="resume-input"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className={styles.fileInput}
                aria-describedby={fileError ? 'resume-error' : undefined}
              />
            </label>
            {fileError && (
              <p id="resume-error" className={styles.fieldError}>{fileError}</p>
            )}
          </fieldset>

          {/* Cover Letter */}
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Cover Letter <span className={styles.optional}>(optional)</span></legend>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Tell the employer why you're a great fit for this role..."
              className={styles.textarea}
              rows={6}
            />
          </fieldset>

          {/* Contact Info */}
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Contact &amp; Links <span className={styles.optional}>(optional)</span></legend>
            <div className={styles.grid2}>
              <Input
                label="Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
              <Input
                label="LinkedIn URL"
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
              />
              <Input
                label="Portfolio / Website"
                type="url"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                placeholder="https://yourportfolio.com"
              />
            </div>
          </fieldset>

          {/* Professional Details */}
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Professional Details <span className={styles.optional}>(optional)</span></legend>
            <div className={styles.grid2}>
              <Input
                label="Current Company"
                value={currentCompany}
                onChange={(e) => setCurrentCompany(e.target.value)}
                placeholder="ACME Corp"
              />
              <Input
                label="Current Title"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
                placeholder="Software Engineer"
              />
              <Input
                label="Years of Experience"
                type="number"
                value={yearsExp}
                onChange={(e) => setYearsExp(e.target.value)}
                placeholder="3"
                min="0"
                max="50"
              />
              <Input
                label="Expected Salary (USD)"
                type="number"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="80000"
                min="0"
              />
              <div className={styles.fullWidth}>
                <Input
                  label="Availability"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="Immediately / 2 weeks notice / specific date"
                />
              </div>
            </div>
          </fieldset>

          {/* Actions */}
          <div className={styles.actions}>
            <Link href={ROUTES.JOB(jobId)}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" disabled={submitting || !resumeFile}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
