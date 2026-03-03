import { withTransaction } from '../../utils/transactions.js';
import { hashToken } from './hashToken.js';
import type { RefreshToken, CreateRefreshTokenInput } from '../../types/auth.js';

export async function rotateToken(
  oldToken: string,
  newTokenInput: CreateRefreshTokenInput
): Promise<RefreshToken> {
  const oldTokenHash = hashToken(oldToken);
  const newTokenHash = hashToken(newTokenInput.token);

  return withTransaction(async (client) => {
    const insertResult = await client.query<RefreshToken>(
      `INSERT INTO refresh_tokens (token_hash, user_id, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        newTokenHash,
        newTokenInput.userId,
        newTokenInput.expiresAt,
        newTokenInput.ipAddress ?? null,
        newTokenInput.userAgent ?? null,
      ]
    );
    const newToken = insertResult.rows[0];

    await client.query(
      `UPDATE refresh_tokens
       SET revoked_at = NOW(), revoked_by_token_id = $2
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [oldTokenHash, newToken.id]
    );

    return newToken;
  });
}
