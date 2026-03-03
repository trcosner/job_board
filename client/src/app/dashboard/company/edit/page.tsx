/**
 * Dashboard – Edit Company Profile
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CompanyForm } from '@/components/companies/CompanyForm';
import { Alert } from '@/components/ui/Alert';
import { ROUTES } from '@/lib/constants';
import { getMyCompany, updateCompany, uploadCompanyLogo } from '@/lib/api/companies';
import type { Company, CreateCompanyData } from '@/types/company';
import styles from '../page.module.css';

export default function DashboardCompanyEditPage() {
  const { user, setUserCompany, loading: authLoading } = useAuth();
  const router = useRouter();

  const [company, setCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN);
      return;
    }
    if (!authLoading && user?.userType !== 'employer') {
      router.push(ROUTES.DASHBOARD);
      return;
    }
    if (!authLoading && user) fetchCompany();
  }, [user, authLoading]);

  async function fetchCompany() {
    try {
      setLoadingCompany(true);
      const res = await getMyCompany();
      setCompany(res.company);
    } catch {
      setError('Failed to load company.');
    } finally {
      setLoadingCompany(false);
    }
  }

  async function handleSubmit(data: CreateCompanyData, logoFile: File | null) {
    if (!company) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await updateCompany(company.id, data);
      let updated = res.company;
      if (logoFile) {
        const logoRes = await uploadCompanyLogo(company.id, logoFile);
        updated = logoRes.company;
      }
      setUserCompany(updated);
      router.push(ROUTES.DASHBOARD_COMPANY);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message ?? 'Failed to update company.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loadingCompany) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Alert variant="error">{error || 'Company not found.'}</Alert>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Edit Company</h1>
            <p className={styles.pageSubtitle}>Update your company information</p>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <CompanyForm
          initialValues={{
            name: company.name,
            description: company.description ?? '',
            website: company.website ?? '',
            industry: company.industry ?? '',
            company_size: company.company_size ?? undefined,
            location: company.location ?? '',
          }}
          onSubmit={handleSubmit}
          loading={submitting}
          submitLabel="Save Changes"
          onCancel={() => router.push(ROUTES.DASHBOARD_COMPANY)}
        />
      </div>
    </div>
  );
}
