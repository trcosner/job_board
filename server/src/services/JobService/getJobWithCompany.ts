import { findJobWithCompany } from '../../repositories/JobRepository/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';
import { JobWithCompany } from '../../types/job.js';

// Cache TTL constant (in seconds)
const CACHE_TTL_JOB_DETAIL = 15 * 60; // 15 minutes

/**
 * Get job with company details (cached)
 */
export async function getJobWithCompany(jobId: string): Promise<JobWithCompany | null> {
  const cacheService = new RedisCacheService();
  const cacheKey = `job:${jobId}:with-company`;
  const cached = await cacheService.get<JobWithCompany>(cacheKey);
  if (cached) return cached;
  const job = await findJobWithCompany(jobId);
  if (job) await cacheService.setex(cacheKey, CACHE_TTL_JOB_DETAIL, job);
  return job;
}
