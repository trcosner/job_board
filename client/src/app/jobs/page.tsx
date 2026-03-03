/**
 * Jobs Listing Page — search, filter, paginate
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { listJobs } from '@/lib/api';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFiltersPanel } from '@/components/jobs/JobFilters';
import type { JobWithCompany, JobFilters } from '@/types/job';
import type { PaginationMeta } from '@/types/pagination';
import styles from './page.module.css';

const PAGE_SIZE = 20;

export default function JobsPage() {
  const { user } = useAuth();
  const isJobSeeker = user?.userType === 'job_seeker';

  const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [filters, setFilters] = useState<JobFilters>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchJobs = useCallback(
    async (activeFilters: JobFilters, activePage: number) => {
      setLoading(true);
      setError('');
      try {
        const result = await listJobs({
          ...activeFilters,
          status: 'active',
          page: activePage,
          limit: PAGE_SIZE,
        });
        setJobs(result.data);
        setPagination(result.pagination);
      } catch {
        setError('Failed to load jobs. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchJobs(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const newFilters = { ...filters, search: value || undefined };
      setFilters(newFilters);
      setPage(1);
      fetchJobs(newFilters, 1);
    }, 400);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const newFilters = { ...filters, search: search || undefined };
    setFilters(newFilters);
    setPage(1);
    fetchJobs(newFilters, 1);
  }

  function handleApplyFilters(newFilters: JobFilters) {
    const merged = { ...newFilters, search: search || undefined };
    setFilters(merged);
    setPage(1);
    fetchJobs(merged, 1);
  }

  function handleClearFilters() {
    setFilters({});
    setSearch('');
    setPage(1);
    fetchJobs({}, 1);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    fetchJobs(filters, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header + search */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Find Your Next Role</h1>
          <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search by title, skill, or company…"
              value={search}
              onChange={handleSearchChange}
              aria-label="Search jobs"
            />
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </form>
        </div>

        {/* Sidebar + list */}
        <div className={styles.layout}>
          {/* Filters sidebar */}
          <aside className={styles.sidebar}>
            <h2 className={styles.sidebarTitle}>Filters</h2>
            <JobFiltersPanel
              initialFilters={filters}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </aside>

          {/* Job list */}
          <div className={styles.listColumn}>
            {/* Results count */}
            <div className={styles.resultsMeta}>
              <span className={styles.resultsCount}>
                {loading
                  ? 'Loading…'
                  : pagination
                    ? `${pagination.total.toLocaleString()} job${pagination.total !== 1 ? 's' : ''} found`
                    : ''}
              </span>
            </div>

            {/* States */}
            {loading && (
              <div className={styles.stateBox}>
                <div className={styles.spinner} aria-hidden="true" />
                <p className={styles.stateText}>Loading jobs…</p>
              </div>
            )}

            {!loading && error && (
              <div className={styles.stateBox}>
                <p className={styles.stateTitle}>Something went wrong</p>
                <p className={styles.stateText}>{error}</p>
              </div>
            )}

            {!loading && !error && jobs.length === 0 && (
              <div className={styles.stateBox}>
                <p className={styles.stateTitle}>No jobs found</p>
                <p className={styles.stateText}>
                  Try adjusting your search or clearing your filters.
                </p>
              </div>
            )}

            {!loading && !error && jobs.length > 0 && (
              <div className={styles.jobList}>
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} showApply={isJobSeeker} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <nav className={styles.pagination} aria-label="Pagination">
                <button
                  className={styles.pageButton}
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 2
                  )
                  .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                      acc.push('ellipsis');
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === 'ellipsis' ? (
                      <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--color-text-tertiary)' }}>
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        className={`${styles.pageButton}${item === page ? ` ${styles.pageButtonActive}` : ''}`}
                        onClick={() => handlePageChange(item as number)}
                        aria-current={item === page ? 'page' : undefined}
                      >
                        {item}
                      </button>
                    )
                  )}

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
      </div>
    </div>
  );
}
