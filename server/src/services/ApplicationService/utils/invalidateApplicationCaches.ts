import { RedisCacheService } from '../../../cache/CacheService.js';

/**
 * Invalidate all caches related to applications
 */
export async function invalidateApplicationCaches(
  cacheService: RedisCacheService,
  jobId: string,
  companyId: string
): Promise<void> {
  const keysToDelete = [
    `stats:job:${jobId}`,
    `stats:company:${companyId}`,
  ];

  await cacheService.del(keysToDelete);
}
