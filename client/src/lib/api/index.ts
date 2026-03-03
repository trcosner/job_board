/**
 * API barrel — import everything from one place:
 *   import { get, post, ApiError } from '@/lib/api';
 *   import { listJobs, createJob } from '@/lib/api';
 *   import { createCompany } from '@/lib/api';
 */

// Core HTTP client
export * from './client';

// Domain services
export * as companiesApi from './companies';
export * as jobsApi from './jobs';
export * as applicationsApi from './applications';

// Re-export individual functions for convenient named imports
export {
  listCompanies,
  getCompanyBySlug,
  getCompanyById,
  getCompanyJobs,
  getMyCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  uploadCompanyLogo,
  getCompanyApplications,
} from './companies';

export {
  listJobs,
  getJob,
  getMyJobs,
  createJob,
  updateJob,
  updateJobStatus,
  deleteJob,
  applyToJob,
  getJobApplications,
  getJobApplicationStats,
} from './jobs';

export {
  getMyApplications,
  getMyApplicationStats,
  getApplication,
  getApplicationHistory,
  getResumeUrl,
  updateApplication,
  withdrawApplication,
  updateApplicationStatus,
} from './applications';
