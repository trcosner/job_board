import { query } from '../../database/connection.js';

export async function cleanupOldTokens(olderThan: Date): Promise<number> {
  const result = await query(
    `DELETE FROM refresh_tokens
     WHERE (expires_at < $1 OR (revoked_at IS NOT NULL AND revoked_at < $1))`,
    [olderThan]
  );
  return result.rowCount ?? 0;
}
