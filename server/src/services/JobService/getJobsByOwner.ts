import { findJobsByCompanyOwner } from '../../repositories/JobRepository/index.js';
import { Job } from '../../types/job.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';

/**
 * Get jobs by company owner (employer dashboard)
 */
export async function getJobsByOwner(
  userId: string,
  pagination: PaginationParams,
  status?: string
): Promise<PaginatedResponse<Job>> {
  return findJobsByCompanyOwner(userId, pagination, status);
}
