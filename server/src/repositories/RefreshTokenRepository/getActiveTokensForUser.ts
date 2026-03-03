import { query } from '../../database/connection.js';
import type { RefreshToken } from '../../types/auth.js';

export async function getActiveTokensForUser(userId: string): Promise<RefreshToken[]> {
  const result = await query<RefreshToken>(
    `SELECT * FROM refresh_tokens
     WHERE user_id = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}
