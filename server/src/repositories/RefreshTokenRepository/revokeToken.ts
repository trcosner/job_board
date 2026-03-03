import { query } from '../../database/connection.js';
import { hashToken } from './hashToken.js';

export async function revokeToken(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  const result = await query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL
     RETURNING id`,
    [tokenHash]
  );
  return (result.rowCount ?? 0) > 0;
}
