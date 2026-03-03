import { query } from '../../database/connection.js';
import { hashToken } from './hashToken.js';
import type { RefreshToken } from '../../types/auth.js';

export async function findByToken(token: string): Promise<RefreshToken | null> {
  const tokenHash = hashToken(token);
  const result = await query<RefreshToken>(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  return result.rows[0] || null;
}
