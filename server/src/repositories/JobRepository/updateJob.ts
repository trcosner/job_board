import { query } from '../../database/connection.js';
import type { Job } from '../../types/job.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function updateJob(
  id: string,
  data: Partial<Omit<Job, 'id' | 'created_at' | 'company_id'>>
): Promise<Job | null> {
  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  const setClauses = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
  const values = [id, ...entries.map(([, v]) => v)];

  try {
    const result = await query<Job>(
      `UPDATE jobs SET ${setClauses}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      values
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error updating job: ${error}`);
  }
}
