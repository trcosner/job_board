'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CompanyForm } from '@/components/companies/CompanyForm';
import { createCompany, uploadCompanyLogo } from '@/lib/api';
import type { CreateCompanyData } from '@/types/company';
import { ROUTES } from '@/lib/constants';
import styles from './page.module.css';

export default function OnboardingCompanyPage() {
  const { user, userCompany, onboardingComplete, loading, setUserCompany } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (user.userType !== 'employer') {
      router.replace(ROUTES.DASHBOARD);
      return;
    }

    if (onboardingComplete && userCompany) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [user, userCompany, onboardingComplete, loading, router]);

  async function handleSubmit(data: CreateCompanyData, logoFile: File | null) {
    setSubmitting(true);
    setError('');

    try {
      // Create the company
      const { company } = await createCompany(data);

      // Upload logo if provided
      if (logoFile) {
        try {
          const { company: updated } = await uploadCompanyLogo(company.id, logoFile);
          setUserCompany(updated);
        } catch {
          // Logo upload failed — proceed with the company as-is
          setUserCompany(company);
        }
      } else {
        setUserCompany(company);
      }

      router.push(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create company. Please try again.';
      setError(message);
      setSubmitting(false);
    }
  }

  // Block render until auth is resolved
  if (loading) return null;
  if (!user || user.userType !== 'employer') return null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <svg
              className={styles.logoIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          </div>
          <p className={styles.step}>Step 1 of 1</p>
          <h1 className={styles.title}>Set up your company profile</h1>
          <p className={styles.subtitle}>
            Tell candidates about your company so they can discover and apply to your jobs.
          </p>
        </div>

        <div className={styles.card}>
          <CompanyForm
            onSubmit={handleSubmit}
            loading={submitting}
            submitLabel="Create Company Profile"
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
