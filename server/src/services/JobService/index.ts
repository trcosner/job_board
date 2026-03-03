/**
 * JobService - Modular service functions for job operations
 * Each function is self-contained and can be imported individually
 */

export { createJob } from './createJob.js';
export { updateJob } from './updateJob.js';
export { getJobById } from './getJobById.js';
export { getJobWithCompany } from './getJobWithCompany.js';
export { incrementViewCount } from './incrementViewCount.js';
export { searchJobs } from './searchJobs.js';
export { getActiveJobs } from './getActiveJobs.js';
export { getJobsByCompanyId } from './getJobsByCompanyId.js';
export { getJobsByOwner } from './getJobsByOwner.js';
export { updateJobStatus } from './updateJobStatus.js';
export { closeJob } from './closeJob.js';
export { activateJob } from './activateJob.js';
export { deleteJob } from './deleteJob.js';
export { getJobCountByStatus } from './getJobCountByStatus.js';

// Export utilities
export * from './utils/index.js';
