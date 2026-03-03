import { updateJob as updateJobRecord } from '../../repositories/JobRepository/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';
import { Job, UpdateJobParams } from '../../types/job.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { verifyJobOwnership, invalidateJobCaches } from './utils/index.js';

/**
 * Update a job posting
 * - Verifies user owns the company that posted the job
 * - Updates job record
 * - Invalidates related caches
 */
export async function updateJob(userId: string, jobId: string, data: UpdateJobParams): Promise<Job> {
  const cacheService = new RedisCacheService();
  const job = await verifyJobOwnership(userId, jobId);
  const updatedJob = await updateJobRecord(jobId, data);
  if (!updatedJob) throw new NotFoundError('Job not found');
  await invalidateJobCaches(cacheService, job.company_id, jobId);
  return updatedJob;
}
