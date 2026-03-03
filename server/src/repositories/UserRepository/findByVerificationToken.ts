import { query } from '../../database/connection.js';
import type { User } from '../../types/user.js';

/**
 * Find user by verification token
 */
export async function findByVerificationToken(token: string): Promise<User | null> {
  const sql = `
    SELECT * FROM users
    WHERE email_verification_token = $1
      AND verification_token_expires_at > CURRENT_TIMESTAMP
      AND deleted_at IS NULL
    LIMIT 1
  `;

  try {
    const result = await query<User>(sql, [token]);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Error finding user by verification token: ${error}`);
  }
}
