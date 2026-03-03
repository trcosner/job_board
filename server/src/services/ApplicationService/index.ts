/**
 * ApplicationService - Modular service functions for application operations
 * Each function is self-contained and can be imported individually
 */

export { createApplication } from './createApplication.js';
export { updateApplicationStatus } from './updateApplicationStatus.js';
export { updateApplication } from './updateApplication.js';
export { getApplicationById } from './getApplicationById.js';
export { getApplicationsForJob } from './getApplicationsForJob.js';
export { getApplicationsByUser } from './getApplicationsByUser.js';
export { searchApplications } from './searchApplications.js';
export { getJobApplicationStats } from './getJobApplicationStats.js';
export { getCompanyApplicationStats } from './getCompanyApplicationStats.js';
export { getUserApplicationStats } from './getUserApplicationStats.js';
export { getApplicationStatusHistory } from './getApplicationStatusHistory.js';
export { getResumeDownloadUrl } from './getResumeDownloadUrl.js';
export { withdrawApplication } from './withdrawApplication.js';
export { deleteApplication } from './deleteApplication.js';

// Export utilities
export * from './utils/index.js';
