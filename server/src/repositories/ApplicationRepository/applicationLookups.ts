import { query } from '../../database/connection.js';
import { Application } from '../../types/application.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function checkDuplicateApplication(userId: string, jobId: string): Promise<boolean> {
  try {
    const result = await query(
      `SELECT 1 FROM applications WHERE user_id = $1 AND job_id = $2 AND deleted_at IS NULL LIMIT 1`,
      [userId, jobId]
    );
    return result.rows.length > 0;
  } catch (error) {
    throw new DatabaseError(`Error checking duplicate application: ${error}`);
  }
}

export async function findByUserAndJob(userId: string, jobId: string): Promise<Application | null> {
  try {
    const result = await query<Application>(
      `SELECT * FROM applications WHERE user_id = $1 AND job_id = $2 AND deleted_at IS NULL LIMIT 1`,
      [userId, jobId]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error finding application by user and job: ${error}`);
  }
}
