'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { CreateJobData, JobType, ExperienceLevel, JobStatus } from '@/types/job';
import { JOB_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '@/types/job';
import styles from './JobForm.module.css';

export interface JobFormProps {
  onSubmit: (data: CreateJobData) => Promise<void>;
  initialValues?: Partial<CreateJobData>;
  loading: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  error?: string;
  /** When true, shows a "Save as Draft" secondary action */
  allowDraft?: boolean;
}

export function JobForm({
  onSubmit,
  initialValues = {},
  loading,
  submitLabel = 'Publish Job',
  onCancel,
  error: externalError,
  allowDraft = true,
}: JobFormProps) {
  const [title, setTitle] = useState(initialValues.title ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [jobType, setJobType] = useState<JobType>(initialValues.job_type ?? 'full_time');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>(
    initialValues.experience_level ?? ''
  );
  const [remote, setRemote] = useState(initialValues.remote ?? false);
  const [isFeatured, setIsFeatured] = useState(initialValues.is_featured ?? false);
  const [location, setLocation] = useState(initialValues.location ?? '');
  const [salaryMin, setSalaryMin] = useState(
    initialValues.salary_min ? String(initialValues.salary_min) : ''
  );
  const [salaryMax, setSalaryMax] = useState(
    initialValues.salary_max ? String(initialValues.salary_max) : ''
  );
  const [deadline, setDeadline] = useState(
    initialValues.application_deadline
      ? initialValues.application_deadline.substring(0, 10)
      : ''
  );
  const [skills, setSkills] = useState<string[]>(initialValues.required_skills ?? []);
  const [skillInput, setSkillInput] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [internalError, setInternalError] = useState('');

  const skillInputRef = useRef<HTMLInputElement>(null);

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Job title is required.';
    if (!description.trim()) errors.description = 'Job description is required.';
    if (salaryMin && salaryMax && Number(salaryMin) > Number(salaryMax)) {
      errors.salary = 'Minimum salary must be less than maximum.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function buildData(status: JobStatus): CreateJobData {
    return {
      title: title.trim(),
      description: description.trim(),
      job_type: jobType,
      status,
      remote,
      is_featured: isFeatured,
      ...(experienceLevel && { experience_level: experienceLevel as ExperienceLevel }),
      ...(location.trim() && { location: location.trim() }),
      ...(salaryMin && { salary_min: Number(salaryMin) }),
      ...(salaryMax && { salary_max: Number(salaryMax) }),
      ...(skills.length && { required_skills: skills }),
      ...(deadline && { application_deadline: new Date(deadline).toISOString() }),
    };
  }

  async function handleSubmit(status: JobStatus) {
    setInternalError('');
    if (!validate()) return;
    try {
      await onSubmit(buildData(status));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setInternalError(message);
    }
  }

  function addSkill(raw: string) {
    const skill = raw.trim();
    if (skill && !skills.includes(skill)) {
      setSkills((prev) => [...prev, skill]);
    }
    setSkillInput('');
  }

  function handleSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
    } else if (e.key === 'Backspace' && !skillInput && skills.length > 0) {
      setSkills((prev) => prev.slice(0, -1));
    }
  }

  function removeSkill(s: string) {
    setSkills((prev) => prev.filter((x) => x !== s));
  }

  const displayError = externalError || internalError;

  return (
    <div className={styles.form}>
      {displayError && <Alert variant="error">{displayError}</Alert>}

      {/* Title */}
      <Input
        label="Job Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={fieldErrors.title}
        required
        fullWidth
        placeholder="e.g. Senior Frontend Engineer"
        disabled={loading}
      />

      {/* Description */}
      <div className={styles.field}>
        <label className={styles.label}>
          Job Description<span className={styles.required}>*</span>
        </label>
        <textarea
          className={`${styles.textarea}${fieldErrors.description ? ` ${styles.textareaError}` : ''}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the role, responsibilities, and what you're looking for…"
          disabled={loading}
          rows={8}
        />
        {fieldErrors.description && (
          <span className={styles.fieldError}>{fieldErrors.description}</span>
        )}
      </div>

      <hr className={styles.sectionDivider} />

      {/* Job Type + Experience Level */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="job-type" className={styles.label}>
            Job Type<span className={styles.required}>*</span>
          </label>
          <select
            id="job-type"
            className={styles.select}
            value={jobType}
            onChange={(e) => setJobType(e.target.value as JobType)}
            disabled={loading}
          >
            {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="experience-level" className={styles.label}>
            Experience Level
          </label>
          <select
            id="experience-level"
            className={styles.select}
            value={experienceLevel}
            onChange={(e) =>
              setExperienceLevel(e.target.value as ExperienceLevel | '')
            }
            disabled={loading}
          >
            <option value="">Any level</option>
            {Object.entries(EXPERIENCE_LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Remote toggle */}
      <div className={styles.toggleRow}>
        <div>
          <p className={styles.toggleLabel}>Remote position</p>
          <p className={styles.toggleSub}>Candidates can work from anywhere</p>
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={remote}
            onChange={(e) => setRemote(e.target.checked)}
            disabled={loading}
          />
          <span className={styles.toggleTrack} />
          <span className={styles.toggleThumb} />
        </label>
      </div>

      {/* Featured toggle */}
      <div className={styles.toggleRow}>
        <div>
          <p className={styles.toggleLabel}>Featured listing</p>
          <p className={styles.toggleSub}>Promote this job at the top of search results</p>
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            disabled={loading}
          />
          <span className={styles.toggleTrack} />
          <span className={styles.toggleThumb} />
        </label>
      </div>

      {/* Location + Deadline */}
      <div className={styles.row}>
        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. San Francisco, CA"
          fullWidth
          disabled={loading}
        />
        <Input
          label="Application Deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          fullWidth
          disabled={loading}
        />
      </div>

      <hr className={styles.sectionDivider} />

      {/* Salary */}
      <div className={styles.row}>
        <Input
          label="Salary Min ($)"
          type="number"
          value={salaryMin}
          onChange={(e) => setSalaryMin(e.target.value)}
          error={fieldErrors.salary}
          placeholder="e.g. 80000"
          fullWidth
          disabled={loading}
        />
        <Input
          label="Salary Max ($)"
          type="number"
          value={salaryMax}
          onChange={(e) => setSalaryMax(e.target.value)}
          placeholder="e.g. 120000"
          fullWidth
          disabled={loading}
        />
      </div>

      <hr className={styles.sectionDivider} />

      {/* Skills */}
      <div className={styles.field}>
        <label className={styles.label}>Required Skills</label>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          className={styles.skillsInput}
          onClick={() => skillInputRef.current?.focus()}
        >
          {skills.map((s) => (
            <span key={s} className={styles.skillTag}>
              {s}
              <button
                type="button"
                className={styles.skillTagRemove}
                onClick={(e) => {
                  e.stopPropagation();
                  removeSkill(s);
                }}
                aria-label={`Remove ${s}`}
                disabled={loading}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={skillInputRef}
            type="text"
            className={styles.skillTagInput}
            placeholder={skills.length === 0 ? 'e.g. React, TypeScript…' : 'Add more…'}
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            onBlur={() => { if (skillInput.trim()) addSkill(skillInput); }}
            disabled={loading}
          />
        </div>
        <p className={styles.skillsHint}>Press Enter or comma to add a skill</p>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {allowDraft && (
          <span className={styles.draftNote}>
            Save as draft to publish later
          </span>
        )}
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        {allowDraft && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit('draft')}
            loading={loading}
            disabled={loading}
          >
            Save Draft
          </Button>
        )}
        <Button
          type="button"
          onClick={() => handleSubmit('active')}
          loading={loading}
          disabled={loading}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
