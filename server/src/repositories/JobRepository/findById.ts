import { query } from '../../database/connection.js';
import type { Job } from '../../types/job.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function findById(id: string): Promise<Job | null> {
  try {
    const result = await query<Job>(
      `SELECT * FROM jobs WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error finding job by ID: ${error}`);
  }
}
