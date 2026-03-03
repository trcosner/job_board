import { query } from '../../database/connection.js';
import type { User } from '../../types/user.js';

/**
 * Find user by email (case-insensitive)
 */
export async function findByEmail(email: string, includeDeleted = false): Promise<User | null> {
  const deletedClause = includeDeleted ? '' : 'AND deleted_at IS NULL';
  const sql = `
    SELECT * FROM users
    WHERE LOWER(email) = LOWER($1) ${deletedClause}
    LIMIT 1
  `;

  try {
    const result = await query<User>(sql, [email]);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Error finding user by email: ${error}`);
  }
}
