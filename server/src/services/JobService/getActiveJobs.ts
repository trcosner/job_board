import { findActiveJobs } from '../../repositories/JobRepository/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';
import { Job } from '../../types/job.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';

// Cache TTL constant (in seconds)
const CACHE_TTL_JOB_LISTING = 5 * 60; // 5 minutes

/**
 * Get active jobs (public listing with caching)
 */
export async function getActiveJobs(pagination: PaginationParams): Promise<PaginatedResponse<Job>> {
  const cacheService = new RedisCacheService();
  const cacheKey = `jobs:active:page:${pagination.page}:limit:${pagination.limit}`;
  const cached = await cacheService.get<PaginatedResponse<Job>>(cacheKey);
  if (cached) return cached;
  const results = await findActiveJobs(pagination);
  await cacheService.setex(cacheKey, CACHE_TTL_JOB_LISTING, results);
  return results;
}
