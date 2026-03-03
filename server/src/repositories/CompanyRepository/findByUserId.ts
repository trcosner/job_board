import { query } from '../../database/connection.js';
import { Company } from '../../types/company.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function findByUserId(userId: string): Promise<Company | null> {
  try {
    const result = await query<Company>(
      `SELECT * FROM companies WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error finding company by user ID: ${error}`);
  }
}
