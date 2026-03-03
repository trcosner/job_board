import { query } from '../../database/connection.js';
import type { User } from '../../types/user.js';

/**
 * Update user password
 */
export async function updatePassword(id: string, passwordHash: string): Promise<User> {
  const sql = `
    UPDATE users
    SET password_hash = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND deleted_at IS NULL
    RETURNING *
  `;

  try {
    const result = await query<User>(sql, [passwordHash, id]);
    if (result.rows.length === 0) {
      throw new Error(`User with id ${id} not found`);
    }
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error updating password: ${error}`);
  }
}
