'use client';

import { useState } from 'react';
import type { JobFilters, JobType, ExperienceLevel } from '@/types/job';
import { JOB_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '@/types/job';
import styles from './JobFilters.module.css';

export interface JobFiltersProps {
  initialFilters?: JobFilters;
  onApply: (filters: JobFilters) => void;
  onClear: () => void;
}

const JOB_TYPES = Object.entries(JOB_TYPE_LABELS) as [JobType, string][];
const EXPERIENCE_LEVELS = Object.entries(EXPERIENCE_LEVEL_LABELS) as [
  ExperienceLevel,
  string,
][];

export function JobFiltersPanel({ initialFilters = {}, onApply, onClear }: JobFiltersProps) {
  const [location, setLocation] = useState(initialFilters.location ?? '');
  const [jobTypes, setJobTypes] = useState<Set<JobType>>(
    new Set(
      Array.isArray(initialFilters.job_type)
        ? initialFilters.job_type
        : initialFilters.job_type
          ? [initialFilters.job_type]
          : []
    )
  );
  const [levels, setLevels] = useState<Set<ExperienceLevel>>(
    new Set(
      Array.isArray(initialFilters.experience_level)
        ? initialFilters.experience_level
        : initialFilters.experience_level
          ? [initialFilters.experience_level]
          : []
    )
  );
  const [remote, setRemote] = useState(initialFilters.remote ?? false);
  const [salaryMin, setSalaryMin] = useState(
    initialFilters.salary_min ? String(initialFilters.salary_min) : ''
  );
  const [salaryMax, setSalaryMax] = useState(
    initialFilters.salary_max ? String(initialFilters.salary_max) : ''
  );

  function toggleJobType(type: JobType) {
    setJobTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  function toggleLevel(level: ExperienceLevel) {
    setLevels((prev) => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  }

  function handleApply() {
    const filters: JobFilters = {};
    if (location.trim()) filters.location = location.trim();
    if (jobTypes.size > 0) filters.job_type = [...jobTypes];
    if (levels.size > 0) filters.experience_level = [...levels];
    if (remote) filters.remote = true;
    if (salaryMin) filters.salary_min = Number(salaryMin);
    if (salaryMax) filters.salary_max = Number(salaryMax);
    onApply(filters);
  }

  function handleClear() {
    setLocation('');
    setJobTypes(new Set());
    setLevels(new Set());
    setRemote(false);
    setSalaryMin('');
    setSalaryMax('');
    onClear();
  }

  return (
    <div className={styles.filters}>
      {/* Job Type */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Job Type</p>
        <div className={styles.checkboxList}>
          {JOB_TYPES.map(([value, label]) => (
            <label key={value} className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={jobTypes.has(value)}
                onChange={() => toggleJobType(value)}
              />
              <span className={styles.checkboxLabel}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Remote */}
      <div className={styles.section}>
        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>Remote only</span>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={remote}
              onChange={(e) => setRemote(e.target.checked)}
            />
            <span className={styles.toggleTrack} />
            <span className={styles.toggleThumb} />
          </label>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Experience Level */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Experience Level</p>
        <div className={styles.checkboxList}>
          {EXPERIENCE_LEVELS.map(([value, label]) => (
            <label key={value} className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={levels.has(value)}
                onChange={() => toggleLevel(value)}
              />
              <span className={styles.checkboxLabel}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Location */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Location</p>
        <input
          type="text"
          className={styles.salaryInput}
          placeholder="City, state, or remote"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className={styles.divider} />

      {/* Salary */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Salary Range</p>
        <div className={styles.salaryRow}>
          <input
            type="number"
            className={styles.salaryInput}
            placeholder="Min ($)"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            min="0"
          />
          <input
            type="number"
            className={styles.salaryInput}
            placeholder="Max ($)"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            min="0"
          />
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button type="button" className={styles.applyButton} onClick={handleApply}>
          Apply Filters
        </button>
        <button type="button" className={styles.clearButton} onClick={handleClear}>
          Clear All
        </button>
      </div>
    </div>
  );
}
