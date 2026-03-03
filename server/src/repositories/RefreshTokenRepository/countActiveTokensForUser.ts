import { query } from '../../database/connection.js';

export async function countActiveTokensForUser(userId: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM refresh_tokens
     WHERE user_id = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()`,
    [userId]
  );
  return parseInt(result.rows[0]?.count ?? '0', 10);
}
