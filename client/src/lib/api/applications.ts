/**
 * Applications API Service
 * All HTTP calls for application-related endpoints.
 */

import { get, patch, del } from './client';
import { API_ENDPOINTS } from '../constants';
import type {
  Application,
  ApplicationWithDetails,
  ApplicationStatusHistory,
  UpdateApplicationData,
  UpdateApplicationStatusData,
  ApplicationFilters,
  ApplicationStats,
} from '@/types/application';
import type { PaginatedResponse } from '@/types/pagination';

// ---------------------------------------------------------------------------
// Job seeker – own applications
// ---------------------------------------------------------------------------

/**
 * GET /applications/me
 * The authenticated job seeker's application list (paginated, filterable).
 */
export function getMyApplications(
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
  return get(`${API_ENDPOINTS.APPLICATIONS.MY_APPLICATIONS}${qs ? `?${qs}` : ''}`);
}

/**
 * GET /applications/stats/me
 * Summary statistics for the authenticated job seeker's applications.
 */
export function getMyApplicationStats(): Promise<{ stats: ApplicationStats }> {
  return get(API_ENDPOINTS.APPLICATIONS.MY_STATS);
}

// ---------------------------------------------------------------------------
// Shared (seeker owns OR employer owns the job's company)
// ---------------------------------------------------------------------------

/**
 * GET /applications/:id
 * Fetch a single application with full job/company/applicant detail.
 */
export function getApplication(id: string): Promise<{ application: ApplicationWithDetails }> {
  return get(API_ENDPOINTS.APPLICATIONS.DETAIL(id));
}

/**
 * GET /applications/:id/history
 * Full status-change history for an application.
 */
export function getApplicationHistory(
  id: string
): Promise<{ history: ApplicationStatusHistory[] }> {
  return get(API_ENDPOINTS.APPLICATIONS.HISTORY(id));
}

/**
 * GET /applications/:id/resume
 * Get a signed download URL for the applicant's resume.
 * The server returns { resumeUrl: string } (a pre-signed S3 URL).
 */
export function getResumeUrl(id: string): Promise<{ resumeUrl: string }> {
  return get(API_ENDPOINTS.APPLICATIONS.RESUME(id));
}

// ---------------------------------------------------------------------------
// Job seeker – edit / withdraw
// ---------------------------------------------------------------------------

/**
 * PATCH /applications/:id
 * Applicant can update supplementary information before an employer first reviews.
 */
export function updateApplication(
  id: string,
  data: UpdateApplicationData
): Promise<{ application: Application }> {
  return patch(API_ENDPOINTS.APPLICATIONS.UPDATE(id), data);
}

/**
 * DELETE /applications/:id
 * Withdraw the application. Only allowed while status is 'applied' or 'reviewing'.
 */
export function withdrawApplication(id: string): Promise<{ message: string }> {
  return del(API_ENDPOINTS.APPLICATIONS.WITHDRAW(id));
}

// ---------------------------------------------------------------------------
// Employer – pipeline management
// ---------------------------------------------------------------------------

/**
 * PATCH /applications/:id/status
 * Move an application through the hiring pipeline.
 * Employer must own the job's company.
 */
export function updateApplicationStatus(
  id: string,
  data: UpdateApplicationStatusData
): Promise<{ application: Application }> {
  return patch(API_ENDPOINTS.APPLICATIONS.UPDATE_STATUS(id), data);
}
