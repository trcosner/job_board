import { findByCompanyId } from '../../repositories/JobRepository/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';
import { Job } from '../../types/job.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';

// Cache TTL constant (in seconds)
const CACHE_TTL_JOB_LISTING = 5 * 60; // 5 minutes

/**
 * Get jobs by company ID
 */
export async function getJobsByCompanyId(
  companyId: string,
  pagination: PaginationParams,
  statusFilter?: Job['status']
): Promise<PaginatedResponse<Job>> {
  const cacheService = new RedisCacheService();
  const cacheKey = `jobs:company:${companyId}:status:${statusFilter || 'all'}:page:${pagination.page}`;
  const cached = await cacheService.get<PaginatedResponse<Job>>(cacheKey);
  if (cached) return cached;
  const results = await findByCompanyId(companyId, pagination, statusFilter);
  await cacheService.setex(cacheKey, CACHE_TTL_JOB_LISTING, results);
  return results;
}
