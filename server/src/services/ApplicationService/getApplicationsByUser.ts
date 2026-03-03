import { findByUserId as findApplicationsByUserId } from '../../repositories/ApplicationRepository/index.js';
import { Application, ApplicationWithDetails } from '../../types/application.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';

/**
 * Get applications by user (job seeker view)
 */
export async function getApplicationsByUser(
  userId: string,
  pagination: PaginationParams,
  statusFilter?: Application['status'],
  jobIdFilter?: string
): Promise<PaginatedResponse<ApplicationWithDetails>> {
  return findApplicationsByUserId(userId, pagination, statusFilter, jobIdFilter);
}
