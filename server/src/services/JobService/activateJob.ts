import { Job } from '../../types/job.js';
import { updateJobStatus } from './updateJobStatus.js';

/**
 * Activate a job (set status to 'active')
 */
export async function activateJob(userId: string, jobId: string): Promise<Job> {
  return updateJobStatus(userId, jobId, 'active');
}
