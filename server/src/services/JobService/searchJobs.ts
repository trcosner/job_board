import { searchJobsAdvanced } from '../../repositories/JobRepository/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';
import { JobFilters, JobWithCompany } from '../../types/job.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';
import { buildSearchCacheKey } from './utils/index.js';

// Cache TTL constant (in seconds)
const CACHE_TTL_SEARCH = 3 * 60; // 3 minutes

/**
 * Search jobs with advanced filters and caching
 */
export async function searchJobs(
  filters: JobFilters,
  pagination: PaginationParams
): Promise<PaginatedResponse<JobWithCompany>> {
  const cacheService = new RedisCacheService();
  const cacheKey = buildSearchCacheKey(filters, pagination);
  const cached = await cacheService.get<PaginatedResponse<JobWithCompany>>(cacheKey);
  if (cached) return cached;

  // Map JobFilters → JobSearchFilters (field name differences)
  const repoFilters = {
    ...filters,
    query: filters.search,
    is_remote: filters.remote,
  };

  const results = await searchJobsAdvanced(repoFilters, pagination.page, pagination.limit);
  await cacheService.setex(cacheKey, CACHE_TTL_SEARCH, results);
  return results;
}
