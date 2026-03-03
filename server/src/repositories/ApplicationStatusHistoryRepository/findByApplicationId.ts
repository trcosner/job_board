import { query } from '../../database/connection.js';
import { ApplicationStatusHistory } from '../../types/application.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function findByApplicationId(applicationId: string): Promise<ApplicationStatusHistory[]> {
  try {
    const result = await query<ApplicationStatusHistory>(
      `SELECT * FROM application_status_history
       WHERE application_id = $1
       ORDER BY created_at ASC`,
      [applicationId]
    );
    return result.rows;
  } catch (error) {
    throw new DatabaseError(`Error finding status history: ${error}`);
  }
}
