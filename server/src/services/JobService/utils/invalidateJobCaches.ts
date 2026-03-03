import { RedisCacheService } from '../../../cache/CacheService.js';

/**
 * Invalidate all caches related to a job
 */
export async function invalidateJobCaches(
  cacheService: RedisCacheService,
  companyId: string,
  jobId?: string
): Promise<void> {
  const keysToDelete: string[] = [];

  // Invalidate specific job caches
  if (jobId) {
    keysToDelete.push(`job:${jobId}`, `job:${jobId}:with-company`);
  }

  // Invalidate company job listings
  keysToDelete.push(`jobs:company:${companyId}:*`);

  // Invalidate general job listings and searches
  keysToDelete.push('jobs:active:*', 'jobs:search:*');

  // Delete all matching keys
  for (const pattern of keysToDelete) {
    if (pattern.includes('*')) {
      await cacheService.invalidatePattern(pattern);
    } else {
      await cacheService.del(pattern);
    }
  }
}
