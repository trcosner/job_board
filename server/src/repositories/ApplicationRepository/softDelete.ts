import { query } from '../../database/connection.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function softDelete(id: string): Promise<boolean> {
  try {
    const result = await query(
      `UPDATE applications SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    throw new DatabaseError(`Error deleting application: ${error}`);
  }
}
