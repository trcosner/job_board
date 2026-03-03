/**
 * Job Types - Client Side
 * Mirrors server/src/types/job.ts
 */

export type JobStatus = 'active' | 'closed' | 'draft';
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
};

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior',
  lead: 'Lead',
  executive: 'Executive',
};

/**
 * Job entity as returned by the API (snake_case, dates as ISO strings)
 */
export interface Job {
  id: string;
  title: string;
  description: string;
  company_id: string;
  posted_by_user_id: string;
  location: string | null;
  job_type: JobType;
  remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  required_skills: string[];
  experience_level: ExperienceLevel | null;
  application_deadline: string | null;
  is_featured: boolean;
  status: JobStatus;
  views_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Job with nested company snapshot (returned by list/detail endpoints)
 */
export interface JobWithCompany extends Job {
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    location: string | null;
    industry: string | null;
    company_size: string | null;
  };
}

/**
 * Data sent to POST /jobs (create)
 * company_id is resolved server-side from the employer's profile; not sent by client.
 */
export interface CreateJobData {
  title: string;
  description: string;
  location?: string;
  job_type: JobType;
  remote?: boolean;
  salary_min?: number;
  salary_max?: number;
  required_skills?: string[];
  experience_level?: ExperienceLevel;
  application_deadline?: string; // ISO datetime string
  is_featured?: boolean;
  status?: JobStatus;
}

/**
 * Data sent to PATCH /jobs/:id (update)
 */
export interface UpdateJobData {
  title?: string;
  description?: string;
  location?: string | null;
  job_type?: JobType;
  remote?: boolean;
  salary_min?: number | null;
  salary_max?: number | null;
  required_skills?: string[];
  experience_level?: ExperienceLevel | null;
  application_deadline?: string | null;
  is_featured?: boolean;
  status?: JobStatus;
}

/**
 * Query params for GET /jobs (list/search)
 */
export interface JobFilters {
  search?: string;
  location?: string;
  job_type?: JobType | JobType[];
  remote?: boolean;
  experience_level?: ExperienceLevel | ExperienceLevel[];
  skills?: string | string[];
  salary_min?: number;
  salary_max?: number;
  company_id?: string;
  status?: JobStatus;
  is_featured?: boolean;
  page?: number;
  limit?: number;
}
