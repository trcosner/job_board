import { softDelete as softDeleteJob } from '../../repositories/JobRepository/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';
import { verifyJobOwnership, invalidateJobCaches } from './utils/index.js';

/**
 * Delete job (soft delete)
 */
export async function deleteJob(userId: string, jobId: string): Promise<void> {
  const cacheService = new RedisCacheService();
  const job = await verifyJobOwnership(userId, jobId);
  await softDeleteJob(jobId);
  await invalidateJobCaches(cacheService, job.company_id, jobId);
}
