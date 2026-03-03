import { query } from '../../database/connection.js';
import { ApplicationStatusHistory } from '../../types/application.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function createHistoryEntry(
  applicationId: string,
  oldStatus: ApplicationStatusHistory['from_status'],
  newStatus: ApplicationStatusHistory['to_status'],
  changedBy?: string,
  notes?: string
): Promise<ApplicationStatusHistory> {
  try {
    const result = await query<ApplicationStatusHistory>(
      `INSERT INTO application_status_history (application_id, from_status, to_status, changed_by_user_id, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [applicationId, oldStatus, newStatus, changedBy ?? null, notes ?? null]
    );
    return result.rows[0];
  } catch (error) {
    throw new DatabaseError(`Error creating status history entry: ${error}`);
  }
}
