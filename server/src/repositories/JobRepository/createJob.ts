import { query } from '../../database/connection.js';
import type { Job } from '../../types/job.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function createJob(
  data: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<Job> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

  try {
    const result = await query<Job>(
      `INSERT INTO jobs (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return result.rows[0];
  } catch (error) {
    throw new DatabaseError(`Error creating job: ${error}`);
  }
}
