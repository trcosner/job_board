import { JobFilters } from '../../../types/job.js';
import { PaginationParams } from '../../../types/pagination.js';

/**
 * Build cache key for job search
 */
export function buildSearchCacheKey(filters: JobFilters, pagination: PaginationParams): string {
  const filterString = JSON.stringify({
    ...filters,
    page: pagination.page,
    limit: pagination.limit,
  });
  
  // Create a hash of the filter string for the cache key
  const hash = Buffer.from(filterString).toString('base64url');
  return `jobs:search:${hash}`;
}
