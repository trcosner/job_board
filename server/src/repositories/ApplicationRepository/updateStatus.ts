import { query } from '../../database/connection.js';
import { Application } from '../../types/application.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function updateStatus(id: string, status: string, notes?: string): Promise<Application | null> {
  const notesClause = notes !== undefined ? ', notes = $3' : '';
  const params: any[] = [id, status];
  if (notes !== undefined) params.push(notes);

  try {
    const result = await query<Application>(
      `UPDATE applications SET status = $2${notesClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      params
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error updating application status: ${error}`);
  }
}
