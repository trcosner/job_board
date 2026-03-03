import { updateJobStatus as updateJobStatusInDB } from '../../repositories/JobRepository/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';
import { Job } from '../../types/job.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { verifyJobOwnership, invalidateJobCaches } from './utils/index.js';

/**
 * Update job status (activate, close, draft)
 */
export async function updateJobStatus(userId: string, jobId: string, status: Job['status']): Promise<Job> {
  const cacheService = new RedisCacheService();
  const job = await verifyJobOwnership(userId, jobId);
  const updatedJob = await updateJobStatusInDB(jobId, status);
  if (!updatedJob) throw new NotFoundError('Job not found');
  await invalidateJobCaches(cacheService, job.company_id, jobId);
  return updatedJob;
}
