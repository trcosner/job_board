import { query } from '../../database/connection.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function countStatusChanges(applicationId: string): Promise<number> {
  try {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM application_status_history
       WHERE application_id = $1`,
      [applicationId]
    );
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    throw new DatabaseError(`Error counting status changes: ${error}`);
  }
}
