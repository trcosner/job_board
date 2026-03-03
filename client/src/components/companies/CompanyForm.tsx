'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { CreateCompanyData, CompanySize } from '@/types/company';
import { COMPANY_SIZE_LABELS } from '@/types/company';
import styles from './CompanyForm.module.css';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Media & Entertainment',
  'Transportation & Logistics',
  'Real Estate',
  'Professional Services',
  'Non-profit',
  'Government',
  'Other',
] as const;

export interface CompanyFormProps {
  onSubmit: (data: CreateCompanyData, logoFile: File | null) => Promise<void>;
  initialValues?: Partial<CreateCompanyData>;
  loading: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  error?: string;
}

export function CompanyForm({
  onSubmit,
  initialValues = {},
  loading,
  submitLabel = 'Save Company',
  onCancel,
  error: externalError,
}: CompanyFormProps) {
  const [name, setName] = useState(initialValues.name ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [website, setWebsite] = useState(initialValues.website ?? '');
  const [industry, setIndustry] = useState(initialValues.industry ?? '');
  const [companySize, setCompanySize] = useState<CompanySize | ''>(
    initialValues.company_size ?? ''
  );
  const [location, setLocation] = useState(initialValues.location ?? '');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [internalError, setInternalError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Company name is required.';
    if (website && !/^https?:\/\/.+/.test(website)) {
      errors.website = 'Website must start with http:// or https://';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setLogoPreviewUrl(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInternalError('');

    if (!validate()) return;

    const data: CreateCompanyData = {
      name: name.trim(),
      ...(description.trim() && { description: description.trim() }),
      ...(website.trim() && { website: website.trim() }),
      ...(industry && { industry }),
      ...(companySize && { company_size: companySize as CompanySize }),
      ...(location.trim() && { location: location.trim() }),
    };

    try {
      await onSubmit(data, logoFile);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setInternalError(message);
    }
  }

  const displayError = externalError || internalError;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {displayError && <Alert variant="error">{displayError}</Alert>}

      {/* Logo upload */}
      <div className={styles.logoSection}>
        <span className={styles.label}>Company Logo</span>
        <div className={styles.logoPreview}>
          {logoPreviewUrl ? (
            <Image
              src={logoPreviewUrl}
              alt="Logo preview"
              width={72}
              height={72}
              className={styles.logoImage}
            />
          ) : (
            <div className={styles.logoPlaceholder}>No logo</div>
          )}
          <div>
            <button
              type="button"
              className={styles.logoUploadButton}
              onClick={() => fileInputRef.current?.click()}
            >
              {logoPreviewUrl ? 'Change logo' : 'Upload logo'}
            </button>
            <p className={styles.logoHint}>PNG, JPG or GIF · Max 2 MB</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className={styles.hiddenInput}
          onChange={handleLogoChange}
          aria-label="Upload company logo"
        />
      </div>

      {/* Name */}
      <Input
        label="Company Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name}
        required
        fullWidth
        autoComplete="organization"
        disabled={loading}
      />

      {/* Description */}
      <div className={styles.field}>
        <label htmlFor="company-description" className={styles.label}>
          Description
        </label>
        <textarea
          id="company-description"
          className={`${styles.textarea} ${fieldErrors.description ? styles.textareaError : ''}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does your company do?"
          disabled={loading}
          rows={4}
        />
        {fieldErrors.description && (
          <span className={styles.fieldError}>{fieldErrors.description}</span>
        )}
      </div>

      <div className={styles.row}>
        {/* Industry */}
        <div className={styles.field}>
          <label htmlFor="company-industry" className={styles.label}>
            Industry
          </label>
          <select
            id="company-industry"
            className={styles.select}
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            disabled={loading}
          >
            <option value="">Select industry</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Company size */}
        <div className={styles.field}>
          <label htmlFor="company-size" className={styles.label}>
            Company Size
          </label>
          <select
            id="company-size"
            className={styles.select}
            value={companySize}
            onChange={(e) => setCompanySize(e.target.value as CompanySize | '')}
            disabled={loading}
          >
            <option value="">Select size</option>
            {Object.entries(COMPANY_SIZE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.row}>
        {/* Website */}
        <Input
          label="Website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          error={fieldErrors.website}
          placeholder="https://example.com"
          fullWidth
          disabled={loading}
        />

        {/* Location */}
        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. San Francisco, CA"
          fullWidth
          disabled={loading}
        />
      </div>

      <div className={styles.actions}>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading} disabled={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
