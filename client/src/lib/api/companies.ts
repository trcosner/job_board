/**
 * Companies API Service
 * All HTTP calls for company-related endpoints.
 */

import { get, post, patch, del } from './client';
import { getAccessToken } from '../auth-tokens';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';
import { ApiError } from './client';
import type { Company, CompanyWithStats, CreateCompanyData, UpdateCompanyData, CompanyFilters } from '@/types/company';
import type { Job, JobFilters } from '@/types/job';
import type { Application, ApplicationFilters } from '@/types/application';
import type { PaginatedResponse } from '@/types/pagination';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * HTTP POST/PATCH with FormData (for file uploads).
 * Skips Content-Type so the browser sets the multipart boundary automatically.
 */
async function uploadFormData<T>(
  method: 'POST' | 'PATCH',
  endpoint: string,
  formData: FormData
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(data?.message || 'Upload failed', response.status, data);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Public endpoints
// ---------------------------------------------------------------------------

/**
 * GET /companies
 * List / search companies (public, paginated).
 */
export function listCompanies(
  filters?: CompanyFilters
): Promise<PaginatedResponse<CompanyWithStats>> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
  }
  const qs = params.toString();
  return get(`${API_ENDPOINTS.COMPANIES.LIST}${qs ? `?${qs}` : ''}`, { requiresAuth: false });
}

/**
 * GET /companies/:slug  (by URL slug, public)
 */
export function getCompanyBySlug(slug: string): Promise<{ company: CompanyWithStats }> {
  return get(API_ENDPOINTS.COMPANIES.BY_SLUG(slug), { requiresAuth: false });
}

/**
 * GET /companies/:id  (by UUID, public)
 */
export function getCompanyById(id: string): Promise<{ company: CompanyWithStats }> {
  return get(API_ENDPOINTS.COMPANIES.DETAIL(id), { requiresAuth: false });
}

/**
 * GET /companies/:id/jobs
 * Public – list active jobs for a given company.
 */
export function getCompanyJobs(
  id: string,
  filters?: JobFilters
): Promise<PaginatedResponse<Job>> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
  }
  const qs = params.toString();
  return get(`${API_ENDPOINTS.COMPANIES.JOBS(id)}${qs ? `?${qs}` : ''}`, {
    requiresAuth: false,
  });
}

// ---------------------------------------------------------------------------
// Authenticated – employer
// ---------------------------------------------------------------------------

/**
 * GET /companies/me
 * Returns the authenticated employer's company.
 */
export function getMyCompany(): Promise<{ company: Company }> {
  return get(API_ENDPOINTS.COMPANIES.ME);
}

/**
 * POST /companies
 * Create a new company (employer onboarding).
 */
export function createCompany(data: CreateCompanyData): Promise<{ company: Company }> {
  return post(API_ENDPOINTS.COMPANIES.CREATE, data);
}

/**
 * PATCH /companies/:id
 * Update company details.
 */
export function updateCompany(
  id: string,
  data: UpdateCompanyData
): Promise<{ company: Company }> {
  return patch(API_ENDPOINTS.COMPANIES.UPDATE(id), data);
}

/**
 * DELETE /companies/:id
 * Soft-delete the company. Employer must own it.
 */
export function deleteCompany(id: string): Promise<{ message: string }> {
  return del(API_ENDPOINTS.COMPANIES.DELETE(id));
}

/**
 * POST /companies/:id/logo
 * Upload or replace the company logo.
 * @param id   Company UUID
 * @param file Image file (JPEG, PNG, WebP, GIF – max 5 MB)
 */
export function uploadCompanyLogo(
  id: string,
  file: File
): Promise<{ company: Company }> {
  const formData = new FormData();
  formData.append('logo', file);
  return uploadFormData('POST', API_ENDPOINTS.COMPANIES.UPLOAD_LOGO(id), formData);
}

/**
 * GET /companies/:id/applications
 * All applications across all jobs owned by this company.
 */
export function getCompanyApplications(
  id: string,
  filters?: ApplicationFilters
): Promise<PaginatedResponse<Application>> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        if (Array.isArray(v)) {
          v.forEach((item) => params.append(k, String(item)));
        } else {
          params.set(k, String(v));
        }
      }
    });
  }
  const qs = params.toString();
  return get(
    `${API_ENDPOINTS.COMPANIES.APPLICATIONS(id)}${qs ? `?${qs}` : ''}`
  );
}
