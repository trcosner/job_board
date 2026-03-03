import { findById as findJobById } from '../../repositories/JobRepository/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';
import { Job } from '../../types/job.js';

// Cache TTL constant (in seconds)
const CACHE_TTL_JOB_DETAIL = 15 * 60; // 15 minutes

/**
 * Get job by ID with caching
 */
export async function getJobById(jobId: string): Promise<Job | null> {
  const cacheService = new RedisCacheService();
  const cacheKey = `job:${jobId}`;
  const cached = await cacheService.get<Job>(cacheKey);
  if (cached) return cached;
  const job = await findJobById(jobId);
  if (job) await cacheService.setex(cacheKey, CACHE_TTL_JOB_DETAIL, job);
  return job;
}
