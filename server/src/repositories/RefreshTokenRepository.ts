import { Pool, QueryConfig, PoolClient } from 'pg';
import { getPool } from '../database/connection.js';
import crypto from 'crypto';

/**
 * RefreshToken entity
 */
export interface RefreshToken {
  id: string;
  token_hash: string;
  user_id: string;
  expires_at: Date;
  revoked_at: Date | null;
  revoked_by_token_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

/**
 * Input for creating a new refresh token
 */
export interface CreateRefreshTokenInput {
  token: string; // Plain token (will be hashed)
  userId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Repository for refresh token operations
 * 
 * Note: Does not extend BaseRepository because refresh tokens have specialized
 * security requirements (hashing, rotation, revocation) that don't fit the
 * standard CRUD pattern.
 */
export class RefreshTokenRepository {
  private pool: Pool;
  private tableName = 'refresh_tokens';

  constructor() {
    this.pool = getPool();
  }

  /**
   * Hash a token using SHA-256
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Store a new refresh token
   */
  async storeToken(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    const tokenHash = this.hashToken(input.token);

    const query: QueryConfig = {
      text: `
        INSERT INTO ${this.tableName} (token_hash, user_id, expires_at, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      values: [
        tokenHash,
        input.userId,
        input.expiresAt,
        input.ipAddress || null,
        input.userAgent || null,
      ],
    };

    const result = await this.pool.query<RefreshToken>(query);
    return result.rows[0];
  }

  /**
   * Find a token by its hash (validates it exists and is active)
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    const tokenHash = this.hashToken(token);

    const query: QueryConfig = {
      text: `
        SELECT * FROM ${this.tableName}
        WHERE token_hash = $1
          AND revoked_at IS NULL
          AND expires_at > NOW()
        LIMIT 1
      `,
      values: [tokenHash],
    };

    const result = await this.pool.query<RefreshToken>(query);
    return result.rows[0] || null;
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeToken(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);

    const query: QueryConfig = {
      text: `
        UPDATE ${this.tableName}
        SET revoked_at = NOW()
        WHERE token_hash = $1
          AND revoked_at IS NULL
        RETURNING id
      `,
      values: [tokenHash],
    };

    const result = await this.pool.query(query);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Revoke all tokens for a user (e.g., during password change or account compromise)
   */
  async revokeAllUserTokens(userId: string): Promise<number> {
    const query: QueryConfig = {
      text: `
        UPDATE ${this.tableName}
        SET revoked_at = NOW()
        WHERE user_id = $1
          AND revoked_at IS NULL
        RETURNING id
      `,
      values: [userId],
    };

    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }

  /**
   * Rotate a refresh token (revoke old, create new, link them)
   * Uses a transaction to ensure atomicity
   */
  async rotateToken(
    oldToken: string,
    newTokenInput: CreateRefreshTokenInput
  ): Promise<RefreshToken> {
    const oldTokenHash = this.hashToken(oldToken);
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Create the new token first
      const newTokenHash = this.hashToken(newTokenInput.token);
      const insertQuery: QueryConfig = {
        text: `
          INSERT INTO ${this.tableName} (token_hash, user_id, expires_at, ip_address, user_agent)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `,
        values: [
          newTokenHash,
          newTokenInput.userId,
          newTokenInput.expiresAt,
          newTokenInput.ipAddress || null,
          newTokenInput.userAgent || null,
        ],
      };
      const insertResult = await client.query<RefreshToken>(insertQuery);
      const newToken = insertResult.rows[0];

      // Revoke the old token and link to the new one
      const revokeQuery: QueryConfig = {
        text: `
          UPDATE ${this.tableName}
          SET revoked_at = NOW(),
              revoked_by_token_id = $2
          WHERE token_hash = $1
            AND revoked_at IS NULL
        `,
        values: [oldTokenHash, newToken.id],
      };
      await client.query(revokeQuery);

      await client.query('COMMIT');
      return newToken;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all active tokens for a user
   */
  async getActiveTokensForUser(userId: string): Promise<RefreshToken[]> {
    const query: QueryConfig = {
      text: `
        SELECT * FROM ${this.tableName}
        WHERE user_id = $1
          AND revoked_at IS NULL
          AND expires_at > NOW()
        ORDER BY created_at DESC
      `,
      values: [userId],
    };

    const result = await this.pool.query<RefreshToken>(query);
    return result.rows;
  }

  /**
   * Clean up expired and revoked tokens older than a certain date
   * (Run this periodically via a cron job)
   */
  async cleanupOldTokens(olderThan: Date): Promise<number> {
    const query: QueryConfig = {
      text: `
        DELETE FROM ${this.tableName}
        WHERE (
          expires_at < $1
          OR (revoked_at IS NOT NULL AND revoked_at < $1)
        )
      `,
      values: [olderThan],
    };

    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }

  /**
   * Count active sessions for a user
   */
  async countActiveTokensForUser(userId: string): Promise<number> {
    const query: QueryConfig = {
      text: `
        SELECT COUNT(*) as count
        FROM ${this.tableName}
        WHERE user_id = $1
          AND revoked_at IS NULL
          AND expires_at > NOW()
      `,
      values: [userId],
    };

    const result = await this.pool.query<{ count: string }>(query);
    return parseInt(result.rows[0]?.count || '0', 10);
  }
}
