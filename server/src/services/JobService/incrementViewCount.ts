import { incrementViewCount as incrementJobViewCount } from '../../repositories/JobRepository/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';

/**
 * Increment job view count (no caching to ensure accuracy)
 */
export async function incrementViewCount(jobId: string): Promise<void> {
  const cacheService = new RedisCacheService();
  await incrementJobViewCount(jobId);
  await cacheService.del(`job:${jobId}`);
}
