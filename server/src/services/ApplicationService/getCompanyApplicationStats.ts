import { getCompanyApplicationStats as getCompanyStatsFromDB } from '../../repositories/ApplicationRepository/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';
import { ApplicationStats } from '../../types/application.js';

// Cache TTL constants (in seconds)
const CACHE_TTL_STATS = 10 * 60; // 10 minutes

/**
 * Get application statistics for a company (with caching)
 */
export async function getCompanyApplicationStats(companyId: string): Promise<ApplicationStats> {
  const cacheService = new RedisCacheService();
  const cacheKey = `stats:company:${companyId}`;
  const cached = await cacheService.get<ApplicationStats>(cacheKey);
  if (cached) return cached;
  const stats = await getCompanyStatsFromDB(companyId);
  await cacheService.setex(cacheKey, CACHE_TTL_STATS, stats);
  return stats;
}
