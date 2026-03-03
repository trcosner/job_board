import { query } from '../../database/connection.js';
import { hashToken } from './hashToken.js';
import type { RefreshToken, CreateRefreshTokenInput } from '../../types/auth.js';

export async function storeToken(input: CreateRefreshTokenInput): Promise<RefreshToken> {
  const tokenHash = hashToken(input.token);
  const result = await query<RefreshToken>(
    `INSERT INTO refresh_tokens (token_hash, user_id, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [tokenHash, input.userId, input.expiresAt, input.ipAddress ?? null, input.userAgent ?? null]
  );
  return result.rows[0];
}
