/**
 * Jobs API Service
 * All HTTP calls for job-related endpoints.
 */

import { get, post, patch, del } from './client';
import { getAccessToken } from '../auth-tokens';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';
import { ApiError } from './client';
import type { Job, JobWithCompany, CreateJobData, UpdateJobData, JobFilters } from '@/types/job';
import type { Application, ApplicationFilters, ApplicationStats, CreateApplicationData } from '@/types/application';
import type { PaginatedResponse } from '@/types/pagination';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Serialize JobFilters into URLSearchParams.
 * Array values (job_type[], skills[], etc.) are appended as multiple params.
 */
function buildJobQuery(filters?: JobFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) {
      v.forEach((item) => params.append(k, String(item)));
    } else {
      params.set(k, String(v));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ---------------------------------------------------------------------------
// Public endpoints
// ---------------------------------------------------------------------------

/**
 * GET /jobs
 * List / search jobs with optional filters and pagination.
 */
export function listJobs(
  filters?: JobFilters
): Promise<PaginatedResponse<JobWithCompany>> {
  return get(`${API_ENDPOINTS.JOBS.LIST}${buildJobQuery(filters)}`, { requiresAuth: false });
}

/**
 * GET /jobs/:id
 * Get a single job by UUID (public).
 */
export function getJob(id: string): Promise<{ job: JobWithCompany }> {
  return get(API_ENDPOINTS.JOBS.DETAIL(id), { requiresAuth: false });
}

// ---------------------------------------------------------------------------
// Authenticated – employer
// ---------------------------------------------------------------------------

/**
 * GET /jobs/my-jobs
 * List the jobs owned by the authenticated employer's company.
 */
export function getMyJobs(
  filters?: Pick<JobFilters, 'status' | 'page' | 'limit'>
): Promise<PaginatedResponse<Job>> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v));
    });
  }
  const qs = params.toString();
  return get(`${API_ENDPOINTS.JOBS.MY_JOBS}${qs ? `?${qs}` : ''}`);
}

/**
 * POST /jobs
 * Create a new job posting. Employer must have a company.
 */
export function createJob(data: CreateJobData): Promise<{ job: Job }> {
  return post(API_ENDPOINTS.JOBS.CREATE, data);
}

/**
 * PATCH /jobs/:id
 * Update an existing job posting.
 */
export function updateJob(id: string, data: UpdateJobData): Promise<{ job: Job }> {
  return patch(API_ENDPOINTS.JOBS.UPDATE(id), data);
}

/**
 * DELETE /jobs/:id
 * Soft-delete a job posting.
 */
export function deleteJob(id: string): Promise<{ message: string }> {
  return del(API_ENDPOINTS.JOBS.DELETE(id));
}

/**
 * PATCH /jobs/:id/status
 * Update a job's status (active | draft | closed).
 */
export function updateJobStatus(
  id: string,
  status: 'active' | 'draft' | 'closed'
): Promise<{ job: Job }> {
  return patch(API_ENDPOINTS.JOBS.STATUS(id), { status });
}

// ---------------------------------------------------------------------------
// Authenticated – job seeker
// ---------------------------------------------------------------------------

/**
 * POST /jobs/:jobId/apply
 * Submit a job application with a resume file.
 *
 * @param jobId   UUID of the job to apply to
 * @param data    Application form fields
 * @param resume  Resume file (PDF / DOC / DOCX, max 10 MB)
 */
export async function applyToJob(
  jobId: string,
  data: CreateApplicationData,
  resume: File
): Promise<{ application: Application }> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const formData = new FormData();
  formData.append('resume', resume);

  // Append all text fields
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) formData.append(k, String(v));
  });

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.JOBS.APPLY(jobId)}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body?.message || 'Application submission failed', response.status, body);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Authenticated – employer (job applications sub-resource)
// ---------------------------------------------------------------------------

/**
 * GET /jobs/:jobId/applications
 * List applications for a specific job (employer, owns job).
 */
export function getJobApplications(
  jobId: string,
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
  return get(`${API_ENDPOINTS.JOBS.APPLICATIONS(jobId)}${qs ? `?${qs}` : ''}`);
}

/**
 * GET /jobs/:jobId/applications/stats
 * Pipeline counts per status for a specific job.
 */
export function getJobApplicationStats(
  jobId: string
): Promise<{ stats: ApplicationStats }> {
  return get(API_ENDPOINTS.JOBS.APPLICATION_STATS(jobId));
}
