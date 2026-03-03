'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { JobWithCompany } from '@/types/job';
import { JOB_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '@/types/job';
import { ROUTES } from '@/lib/constants';
import styles from './JobCard.module.css';

export interface JobCardProps {
  job: JobWithCompany;
  /** Show the Apply button — only for authenticated job seekers */
  showApply?: boolean;
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

export function JobCard({ job, showApply = false }: JobCardProps) {
  const { company } = job;
  const router = useRouter();
  const initials = company.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const salary = formatSalary(job.salary_min, job.salary_max);
  const MAX_SKILLS = 4;

  return (
    <div
      className={styles.card}
      onClick={() => router.push(ROUTES.JOB(job.id))}
      onKeyDown={(e) => e.key === 'Enter' && router.push(ROUTES.JOB(job.id))}
      role="link"
      tabIndex={0}
      aria-label={`${job.title} at ${company.name}`}
    >
      {/* Header: logo + title + company */}
      <div className={styles.header}>
        {company.logo_url ? (
          <Image
            src={company.logo_url}
            alt={`${company.name} logo`}
            width={44}
            height={44}
            className={styles.companyLogo}
          />
        ) : (
          <div className={styles.companyLogoPlaceholder} aria-hidden="true">
            {initials}
          </div>
        )}
        <div className={styles.headerInfo}>
          <h3 className={styles.title}>{job.title}</h3>
          <p className={styles.companyName}>{company.name}</p>
        </div>
      </div>

      {/* Type / remote / level badges */}
      <div className={styles.badges}>
        <span className={styles.badge + ' ' + styles.badgeType}>
          {JOB_TYPE_LABELS[job.job_type]}
        </span>
        {job.remote && (
          <span className={styles.badge + ' ' + styles.badgeRemote}>Remote</span>
        )}
        {job.experience_level && (
          <span className={styles.badge + ' ' + styles.badgeLevel}>
            {EXPERIENCE_LEVEL_LABELS[job.experience_level]}
          </span>
        )}
        {job.is_featured && (
          <span className={styles.badge + ' ' + styles.badgeFeatured}>Featured</span>
        )}
      </div>

      {/* Location / deadline meta */}
      {(job.location || job.application_deadline) && (
        <div className={styles.meta}>
          {job.location && (
            <span className={styles.metaItem}>
              <svg
                className={styles.metaIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {job.location}
            </span>
          )}
          {job.application_deadline && (
            <span className={styles.metaItem}>
              <svg
                className={styles.metaIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Closes{' '}
              {new Date(job.application_deadline).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      )}

      {/* Skills */}
      {job.required_skills.length > 0 && (
        <div className={styles.skills}>
          {job.required_skills.slice(0, MAX_SKILLS).map((skill) => (
            <span key={skill} className={styles.skill}>
              {skill}
            </span>
          ))}
          {job.required_skills.length > MAX_SKILLS && (
            <span className={styles.skillMore}>
              +{job.required_skills.length - MAX_SKILLS} more
            </span>
          )}
        </div>
      )}

      {/* Footer: salary + date + apply */}
      <div className={styles.footer}>
        <div>
          {salary && <span className={styles.salary}>{salary}</span>}
          <span className={`${styles.postedDate}${salary ? '' : ''}`} style={{ marginLeft: salary ? '0.75rem' : 0 }}>
            {timeAgo(job.created_at)}
          </span>
        </div>
        {showApply && (
          <Link
            href={ROUTES.JOB_APPLY(job.id)}
            className={styles.applyButton}
            onClick={(e) => e.stopPropagation()}
          >
            Apply
          </Link>
        )}
      </div>
    </div>
  );
}
