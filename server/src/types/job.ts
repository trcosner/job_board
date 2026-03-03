import { BaseEntity } from './base.js';

/**
 * Job status types
 */
export type JobStatus = 'active' | 'closed' | 'draft';

/**
 * Job type categories
 */
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship';

/**
 * Experience level requirements
 */
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';

/**
 * Job entity from database
 */
export interface Job extends BaseEntity {
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
  application_deadline: Date | null;
  is_featured: boolean;
  status: JobStatus;
  views_count: number;
}

/**
 * Job with company information included
 */
export interface JobWithCompany extends Job {
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    location: string | null;
    industry: string | null;
  };
}

/**
 * Job with application statistics
 */
export interface JobWithStats extends Job {
  applications_count?: number;
  applications_by_status?: Record<string, number>;
}

/**
 * Parameters for creating a new job
 */
export interface CreateJobParams {
  title: string;
  description: string;
  company_id: string;
  posted_by_user_id: string;
  location?: string;
  job_type: JobType;
  remote?: boolean;
  salary_min?: number;
  salary_max?: number;
  required_skills?: string[];
  experience_level?: ExperienceLevel;
  application_deadline?: Date;
  is_featured?: boolean;
  status?: JobStatus;
}

/**
 * Parameters for updating a job
 */
export interface UpdateJobParams {
  title?: string;
  description?: string;
  location?: string | null;
  job_type?: JobType;
  remote?: boolean;
  salary_min?: number | null;
  salary_max?: number | null;
  required_skills?: string[];
  experience_level?: ExperienceLevel | null;
  application_deadline?: Date | null;
  is_featured?: boolean;
  status?: JobStatus;
}

/**
 * Filters for searching/filtering jobs
 */
export interface JobFilters {
  search?: string; // Full-text search on title/description
  location?: string;
  job_type?: JobType | JobType[];
  remote?: boolean;
  experience_level?: ExperienceLevel | ExperienceLevel[];
  skills?: string | string[];
  salary_min?: number;
  salary_max?: number;
  company_id?: string;
  status?: JobStatus | JobStatus[];
  is_featured?: boolean;
}

/**
 * Filters used by the advanced full-text search query (searchJobsAdvanced)
 */
export interface JobSearchFilters {
  query?: string;
  status?: JobStatus | JobStatus[];
  job_type?: JobType | JobType[];
  experience_level?: ExperienceLevel | ExperienceLevel[];
  location?: string;
  is_remote?: boolean;
  salary_min?: number;
  salary_max?: number;
  company_id?: string;
}

/**
 * Job result from advanced search — includes nested company snapshot
 */
export interface JobSearchResult extends Job {
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
