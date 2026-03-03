import { findByIdWithDetails } from '../../repositories/ApplicationRepository/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';
import { ApplicationWithDetails } from '../../types/application.js';

// Cache TTL constants (in seconds)
const CACHE_TTL_APPLICATION = 5 * 60; // 5 minutes

/**
 * Get application by ID with full details
 */
export async function getApplicationById(applicationId: string): Promise<ApplicationWithDetails | null> {
  const cacheService = new RedisCacheService();
  const cacheKey = `application:${applicationId}:details`;
  const cached = await cacheService.get<ApplicationWithDetails>(cacheKey);
  if (cached) return cached;
  const application = await findByIdWithDetails(applicationId);
  if (application) await cacheService.setex(cacheKey, CACHE_TTL_APPLICATION, application);
  return application;
}
