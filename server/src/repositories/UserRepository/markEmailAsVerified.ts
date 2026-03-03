import { query } from '../../database/connection.js';
import type { User } from '../../types/user.js';

/**
 * Mark user email as verified
 */
export async function markEmailAsVerified(id: string): Promise<User> {
  const sql = `
    UPDATE users
    SET email_verified = true,
        email_verification_token = NULL,
        verification_token_expires_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *
  `;

  try {
    const result = await query<User>(sql, [id]);
    if (result.rows.length === 0) {
      throw new Error(`User with id ${id} not found`);
    }
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error marking email as verified: ${error}`);
  }
}
