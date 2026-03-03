import { Job } from '../../types/job.js';
import { updateJobStatus } from './updateJobStatus.js';

/**
 * Close a job (set status to 'closed')
 */
export async function closeJob(userId: string, jobId: string): Promise<Job> {
  return updateJobStatus(userId, jobId, 'closed');
}
