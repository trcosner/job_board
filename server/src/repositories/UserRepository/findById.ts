import { query } from '../../database/connection.js';
import type { User } from '../../types/user.js';

/**
 * Find user by ID
 */
export async function findById(id: string, includeDeleted = false): Promise<User | null> {
  const deletedClause = includeDeleted ? '' : 'AND deleted_at IS NULL';
  const sql = `
    SELECT * FROM users
    WHERE id = $1 ${deletedClause}
    LIMIT 1
  `;

  try {
    const result = await query<User>(sql, [id]);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Error finding user by ID: ${error}`);
  }
}
