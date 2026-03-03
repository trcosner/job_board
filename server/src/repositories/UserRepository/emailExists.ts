import { query } from '../../database/connection.js';

/**
 * Check if email already exists
 */
export async function emailExists(email: string, excludeUserId?: string): Promise<boolean> {
  const excludeClause = excludeUserId ? 'AND id != $2' : '';
  const sql = `
    SELECT 1 FROM users
    WHERE LOWER(email) = LOWER($1) 
      AND deleted_at IS NULL
      ${excludeClause}
    LIMIT 1
  `;

  try {
    const values = excludeUserId ? [email, excludeUserId] : [email];
    const result = await query(sql, values);
    return result.rows.length > 0;
  } catch (error) {
    throw new Error(`Error checking email existence: ${error}`);
  }
}
