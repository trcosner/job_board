/**
 * Application Types - Client Side
 * Mirrors server/src/types/application.ts
 */

export type ApplicationStatus =
  | 'applied'
  | 'reviewing'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  reviewing: 'Reviewing',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

/** Statuses that can be set by an employer */
export const EMPLOYER_STATUSES: ApplicationStatus[] = [
  'reviewing',
  'interview',
  'offer',
  'hired',
  'rejected',
];

/** Statuses from which a job seeker can still withdraw */
export const WITHDRAWABLE_STATUSES: ApplicationStatus[] = ['applied', 'reviewing'];

/**
 * Application entity as returned by the API
 */
export interface Application {
  id: string;
  job_id: string;
  user_id: string;
  status: ApplicationStatus;
  resume_url: string;
  resume_filename: string;
  cover_letter: string | null;
  phone: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  years_experience: number | null;
  current_company: string | null;
  current_title: string | null;
  expected_salary: number | null;
  availability: string | null;
  notes: string | null;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Application with nested job, company, and applicant info
 * Returned by GET /applications/:id
 */
export interface ApplicationWithDetails extends Application {
  job: {
    id: string;
    title: string;
    location: string | null;
    job_type: string;
    salary_min: number | null;
    salary_max: number | null;
    experience_level: string | null;
    status: string;
    company_id: string;
  };
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  };
  applicant: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

/**
 * Single entry in the status-change history
 */
export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_by_user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  notes: string | null;
  created_at: string;
}

/**
 * Form data sent to POST /jobs/:jobId/apply
 * The resume file is sent separately as a FormData field named "resume".
 */
export interface CreateApplicationData {
  cover_letter?: string;
  phone?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  years_experience?: number;
  current_company?: string;
  current_title?: string;
  expected_salary?: number;
  availability?: string;
}

/**
 * Data sent to PATCH /applications/:id/status
 */
export interface UpdateApplicationStatusData {
  status: ApplicationStatus;
  notes?: string;
}

/**
 * Data sent to PATCH /applications/:id (applicant edits)
 */
export interface UpdateApplicationData {
  cover_letter?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  years_experience?: number | null;
  current_company?: string | null;
  current_title?: string | null;
  expected_salary?: number | null;
  availability?: string | null;
  notes?: string | null;
}

/**
 * Query params for application list endpoints
 */
export interface ApplicationFilters {
  job_id?: string;
  status?: ApplicationStatus | ApplicationStatus[];
  page?: number;
  limit?: number;
}

/**
 * Aggregated stats for a job's application pipeline
 */
export interface ApplicationStats {
  total_applications: number;
  pending_count: number;
  reviewing_count: number;
  shortlisted_count: number;
  interviewing_count: number;
  offered_count: number;
  hired_count: number;
  rejected_count: number;
  withdrawn_count: number;
}
