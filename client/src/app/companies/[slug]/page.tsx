'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCompanyBySlug, getCompanyJobs } from '@/lib/api/companies';
import { ROUTES } from '@/lib/constants';
import type { CompanyWithStats } from '@/types/company';
import { COMPANY_SIZE_LABELS } from '@/types/company';
import type { Job } from '@/types/job';
import { JOB_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '@/types/job';
import styles from './page.module.css';

const JOBS_PER_PAGE = 10;

export default function CompanyProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [company, setCompany] = useState<CompanyWithStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsPage, setJobsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Load company data
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getCompanyBySlug(slug)
      .then((res) => setCompany(res.company))
      .catch((err) => {
        if (err?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Load company jobs
  useEffect(() => {
    if (!company) return;
    setJobsLoading(true);
    getCompanyJobs(company.id, { page: jobsPage, limit: JOBS_PER_PAGE, status: 'active' })
      .then((res) => {
        setJobs(res.data ?? []);
        setJobsTotal(res.pagination?.total ?? 0);
      })
      .catch(() => {
        setJobs([]);
      })
      .finally(() => setJobsLoading(false));
  }, [company, jobsPage]);

  const totalJobPages = Math.ceil(jobsTotal / JOBS_PER_PAGE);

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <p className={styles.loadingText}>Loading company profile…</p>
      </div>
    );
  }

  if (notFound || !company) {
    return (
      <div className={styles.notFoundWrapper}>
        <h1 className={styles.notFoundTitle}>Company not found</h1>
        <p className={styles.notFoundSubtitle}>
          This company profile doesn&apos;t exist or may have been removed.
        </p>
        <Link href={ROUTES.JOBS} className={styles.backLink}>
          Browse all jobs
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hero header */}
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          {company.logo_url ? (
            <Image
              src={company.logo_url}
              alt={`${company.name} logo`}
              width={80}
              height={80}
              className={styles.logo}
            />
          ) : (
            <div className={styles.logoPlaceholder}>
              {company.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={styles.heroMeta}>
            <h1 className={styles.companyName}>{company.name}</h1>
            <div className={styles.metaList}>
              {company.industry && (
                <span className={styles.metaItem}>{company.industry}</span>
              )}
              {company.location && (
                <span className={styles.metaItem}>📍 {company.location}</span>
              )}
              {company.company_size && (
                <span className={styles.metaItem}>
                  👥 {COMPANY_SIZE_LABELS[company.company_size]}
                </span>
              )}
              {company.website && (
                <a
                  href={
                    company.website.startsWith('http')
                      ? company.website
                      : `https://${company.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.websiteLink}
                >
                  🌐 {company.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {(company.active_jobs_count != null || company.total_applications_count != null) && (
          <div className={styles.statsBar}>
            {company.active_jobs_count != null && (
              <div className={styles.stat}>
                <span className={styles.statValue}>{company.active_jobs_count}</span>
                <span className={styles.statLabel}>Open Positions</span>
              </div>
            )}
            {company.jobs_count != null && (
              <div className={styles.stat}>
                <span className={styles.statValue}>{company.jobs_count}</span>
                <span className={styles.statLabel}>Jobs Posted</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* About */}
        {company.description && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>About {company.name}</h2>
            <p className={styles.description}>{company.description}</p>
          </section>
        )}

        {/* Active jobs */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Open Positions{' '}
            {jobsTotal > 0 && (
              <span className={styles.jobCount}>({jobsTotal})</span>
            )}
          </h2>

          {jobsLoading ? (
            <p className={styles.loadingText}>Loading jobs…</p>
          ) : jobs.length === 0 ? (
            <div className={styles.noJobs}>
              <p>No open positions at the moment.</p>
              <p className={styles.noJobsHint}>Check back later for new opportunities.</p>
            </div>
          ) : (
            <>
              <ul className={styles.jobList}>
                {jobs.map((job) => (
                  <li key={job.id} className={styles.jobCard}>
                    <Link href={ROUTES.JOB(job.id)} className={styles.jobLink}>
                      <div className={styles.jobHeader}>
                        <h3 className={styles.jobTitle}>{job.title}</h3>
                        {job.is_featured && (
                          <span className={styles.featuredBadge}>Featured</span>
                        )}
                      </div>
                      <div className={styles.jobMeta}>
                        {job.location && (
                          <span className={styles.jobMetaItem}>
                            📍 {job.remote ? `${job.location} (Remote)` : job.location}
                          </span>
                        )}
                        {job.remote && !job.location && (
                          <span className={styles.jobMetaItem}>🌐 Remote</span>
                        )}
                        <span className={styles.jobMetaItem}>
                          {JOB_TYPE_LABELS[job.job_type]}
                        </span>
                        {job.experience_level && (
                          <span className={styles.jobMetaItem}>
                            {EXPERIENCE_LEVEL_LABELS[job.experience_level]}
                          </span>
                        )}
                        {(job.salary_min || job.salary_max) && (
                          <span className={styles.jobMetaItem}>
                            💰{' '}
                            {job.salary_min && job.salary_max
                              ? `$${(job.salary_min / 1000).toFixed(0)}k – $${(job.salary_max / 1000).toFixed(0)}k`
                              : job.salary_min
                              ? `From $${(job.salary_min / 1000).toFixed(0)}k`
                              : `Up to $${(job.salary_max! / 1000).toFixed(0)}k`}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {totalJobPages > 1 && (
                <div className={styles.jobPagination}>
                  <button
                    className={styles.pageBtn}
                    disabled={jobsPage === 1}
                    onClick={() => setJobsPage((p) => p - 1)}
                  >
                    ← Previous
                  </button>
                  <span className={styles.pageInfo}>
                    Page {jobsPage} of {totalJobPages}
                  </span>
                  <button
                    className={styles.pageBtn}
                    disabled={jobsPage === totalJobPages}
                    onClick={() => setJobsPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
