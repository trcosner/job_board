import { query } from '../../database/connection.js';

export async function revokeAllUserTokens(userId: string): Promise<number> {
  const result = await query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL
     RETURNING id`,
    [userId]
  );
  return result.rowCount ?? 0;
}
