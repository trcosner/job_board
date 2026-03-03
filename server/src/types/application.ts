import { BaseEntity } from './base.js';

/**
 * Application status types (workflow phases)
 */
export type ApplicationStatus = 
  | 'applied' 
  | 'reviewing' 
  | 'interview' 
  | 'offer' 
  | 'hired' 
  | 'rejected'
  | 'withdrawn';

/**
 * Application entity from database
 */
export interface Application extends BaseEntity {
  job_id: string;
  user_id: string; // Job seeker
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
  notes: string | null; // Internal employer notes
  reviewed_at: Date | null;
  reviewed_by_user_id: string | null;
}

/**
 * Application with job and company details
 */
export interface ApplicationWithDetails extends Application {
  job: {
    id: string;
    title: string;
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
 * Application status history entry
 */
export interface ApplicationStatusHistory extends BaseEntity {
  application_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_by_user_id: string | null;
  notes: string | null;
}

/**
 * Application status history with user details
 */
export interface ApplicationStatusHistoryWithUser extends Omit<ApplicationStatusHistory, 'changed_by_user_id'> {
  changed_by_user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

/**
 * Parameters for creating a new application
 */
export interface CreateApplicationParams {
  job_id: string;
  user_id: string;
  resume_url: string;
  resume_filename: string;
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
 * Parameters for updating application status
 */
export interface UpdateApplicationStatusParams {
  status: ApplicationStatus;
  reviewed_by_user_id: string;
  notes?: string;
}

/**
 * Parameters for updating application details (by applicant or employer)
 */
export interface UpdateApplicationParams {
  cover_letter?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  years_experience?: number | null;
  current_company?: string | null;
  current_title?: string | null;
  expected_salary?: number | null;
  availability?: string | null;
  notes?: string | null; // Employer only
}

/**
 * Filters for searching/filtering applications
 */
export interface ApplicationFilters {
  job_id?: string;
  user_id?: string;
  company_id?: string;
  status?: ApplicationStatus | ApplicationStatus[];
  reviewed?: boolean; // Has been reviewed
  date_from?: Date;
  date_to?: Date;
}

/**
 * Application statistics by status
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
