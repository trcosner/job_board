import { query } from '../../database/connection.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function findByApplicationIdWithUser(applicationId: string): Promise<any[]> {
  try {
    const result = await query(
      `SELECT 
        h.*,
        json_build_object(
          'id', u.id,
          'email', u.email,
          'first_name', u.first_name,
          'last_name', u.last_name
        ) as changed_by_user
       FROM application_status_history h
       LEFT JOIN users u ON h.changed_by_user_id = u.id
       WHERE h.application_id = $1
       ORDER BY h.created_at ASC`,
      [applicationId]
    );
    return result.rows;
  } catch (error) {
    throw new DatabaseError(`Error finding status history with user details: ${error}`);
  }
}
