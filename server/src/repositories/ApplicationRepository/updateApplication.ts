import { query } from '../../database/connection.js';
import type { Application } from '../../types/application.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function updateApplication(
  id: string,
  data: Partial<Omit<Application, 'id' | 'created_at' | 'user_id' | 'job_id'>>
): Promise<Application> {
  const entries = Object.entries(data);
  if (entries.length === 0) throw new Error('No data provided for update');

  const setClauses = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
  const values = [id, ...entries.map(([, v]) => v)];

  try {
    const result = await query<Application>(
      `UPDATE applications SET ${setClauses}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      values
    );
    if (!result.rows[0]) throw new DatabaseError('Application not found');
    return result.rows[0];
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Error updating application: ${error}`);
  }
}
