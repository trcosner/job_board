'use client';

import Image from 'next/image';
import type { CompanyWithStats } from '@/types/company';
import { COMPANY_SIZE_LABELS } from '@/types/company';
import styles from './CompanyProfile.module.css';

export interface CompanyProfileProps {
  company: CompanyWithStats;
  isOwner?: boolean;
  onEdit?: () => void;
}

export function CompanyProfile({ company, isOwner = false, onEdit }: CompanyProfileProps) {
  const initials = company.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className={styles.profile}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logoWrapper}>
          {company.logo_url ? (
            <Image
              src={company.logo_url}
              alt={`${company.name} logo`}
              width={80}
              height={80}
              className={styles.logoImage}
            />
          ) : (
            <div className={styles.logoPlaceholder} aria-hidden="true">
              {initials}
            </div>
          )}
        </div>

        <div className={styles.headerInfo}>
          <h2 className={styles.name}>{company.name}</h2>
          {company.industry && <p className={styles.industry}>{company.industry}</p>}

          <div className={styles.meta}>
            {company.location && (
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
                {company.location}
              </span>
            )}

            {company.company_size && (
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
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {COMPANY_SIZE_LABELS[company.company_size]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {company.description && (
        <p className={styles.description}>{company.description}</p>
      )}

      {/* Stats */}
      {(company.jobs_count !== undefined || company.total_applications_count !== undefined) && (
        <div className={styles.stats}>
          {company.active_jobs_count !== undefined && (
            <div className={styles.stat}>
              <span className={styles.statValue}>{company.active_jobs_count}</span>
              <span className={styles.statLabel}>Open Jobs</span>
            </div>
          )}
          {company.jobs_count !== undefined && (
            <div className={styles.stat}>
              <span className={styles.statValue}>{company.jobs_count}</span>
              <span className={styles.statLabel}>Total Jobs</span>
            </div>
          )}
          {company.total_applications_count !== undefined && (
            <div className={styles.stat}>
              <span className={styles.statValue}>{company.total_applications_count}</span>
              <span className={styles.statLabel}>Applications</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.websiteLink}
          >
            Visit website
            <svg
              className={styles.externalIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
