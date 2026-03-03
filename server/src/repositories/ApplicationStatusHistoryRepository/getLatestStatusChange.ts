import { query } from '../../database/connection.js';
import { ApplicationStatusHistory } from '../../types/application.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function getLatestStatusChange(applicationId: string): Promise<ApplicationStatusHistory | null> {
  try {
    const result = await query<ApplicationStatusHistory>(
      `SELECT * FROM application_status_history
       WHERE application_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [applicationId]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error getting latest status change: ${error}`);
  }
}
