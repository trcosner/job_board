import { query } from '../../database/connection.js';
import { Job } from '../../types/job.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function closeJob(id: string): Promise<Job | null> {
  try {
    const result = await query<Job>(
      `UPDATE jobs SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error closing job: ${error}`);
  }
}

export async function activateJob(id: string): Promise<Job | null> {
  try {
    const result = await query<Job>(
      `UPDATE jobs SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error activating job: ${error}`);
  }
}

export async function updateJobStatus(id: string, status: string): Promise<Job | null> {
  try {
    const result = await query<Job>(
      `UPDATE jobs SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [id, status]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error updating job status: ${error}`);
  }
}
