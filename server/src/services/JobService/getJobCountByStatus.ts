import { countByStatus } from '../../repositories/JobRepository/index.js';
import { Job } from '../../types/job.js';

/**
 * Get job count by status
 */
export async function getJobCountByStatus(status: Job['status']): Promise<number> {
  const counts = await countByStatus();
  return counts[status] ?? 0;
}
