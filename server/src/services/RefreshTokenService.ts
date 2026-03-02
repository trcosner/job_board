import { BaseService } from './BaseService.js';
import { RefreshTokenRepository } from '../repositories/RefreshTokenRepository.js';
import logger from '../utils/logger.js';

/**
 * Refresh Token Service - PostgreSQL based
 * 
 * Modern authentication pattern:
 * - Access tokens: Stateless JWT (no DB lookup per request)
 * - Refresh tokens: Tracked in database (allows revocation)
 * 
 * Why PostgreSQL instead of Redis Sessions?
 * ✅ Not on critical path (only checked on refresh, not every request)
 * ✅ Persistent storage (survives Redis restarts)
 * ✅ ACID guarantees for security-critical operations
 * ✅ Can join with users table for auditing
 * 
 * Production companies (GitHub, Stripe, Auth0) use this pattern.
 */

export class RefreshTokenService extends BaseService {
  private refreshTokenRepository: RefreshTokenRepository;

  constructor() {
    super();
    this.refreshTokenRepository = new RefreshTokenRepository();
  }

  /**
   * Store a new refresh token
   */
  async storeToken(
    token: string,
    userId: string,
    expiresAt: Date,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<boolean> {
    try {
      await this.refreshTokenRepository.storeToken({
        token,
        userId,
        expiresAt,
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
      });

      this.logDebug('storeToken', 'Refresh token stored', { userId, expiresAt });
      return true;
    } catch (error) {
      this.logError('storeToken', error, { userId });
      return false;
    }
  }

  /**
   * Verify and retrieve refresh token
   * Returns token data if valid, null if token doesn't exist, is revoked, or expired
   */
  async verifyToken(token: string): Promise<{ userId: string } | null> {
    try {
      const tokenData = await this.refreshTokenRepository.findByToken(token);
      
      if (!tokenData) {
        this.logDebug('verifyToken', 'Token not found or invalid');
        return null;
      }

      return { userId: tokenData.user_id };
    } catch (error) {
      this.logError('verifyToken', error);
      return null;
    }
  }

  /**
   * Revoke a specific refresh token (single logout)
   */
  async revokeToken(token: string): Promise<boolean> {
    try {
      const result = await this.refreshTokenRepository.revokeToken(token);
      
      this.logInfo('revokeToken', 'Refresh token revoked', { revoked: result });
      return result;
    } catch (error) {
      this.logError('revokeToken', error);
      return false;
    }
  }

  /**
   * Revoke all refresh tokens for a user (logout everywhere)
   */
  async revokeAllUserTokens(userId: string): Promise<boolean> {
    try {
      const count = await this.refreshTokenRepository.revokeAllUserTokens(userId);
      
      this.logInfo('revokeAllUserTokens', 'All user refresh tokens revoked', { userId, count });
      return true;
    } catch (error) {
      this.logError('revokeAllUserTokens', error, { userId });
      return false;
    }
  }

  /**
   * Rotate refresh token (revoke old, issue new, link them)
   * Used during token refresh to implement token rotation security
   */
  async rotateToken(
    oldToken: string,
    newToken: string,
    userId: string,
    expiresAt: Date,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<boolean> {
    try {
      await this.refreshTokenRepository.rotateToken(oldToken, {
        token: newToken,
        userId,
        expiresAt,
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
      });

      this.logDebug('rotateToken', 'Token rotated successfully', { userId });
      return true;
    } catch (error) {
      this.logError('rotateToken', error, { userId });
      return false;
    }
  }

  /**
   * Get active session count for a user
   */
  async getActiveSessionCount(userId: string): Promise<number> {
    try {
      return await this.refreshTokenRepository.countActiveTokensForUser(userId);
    } catch (error) {
      this.logError('getActiveSessionCount', error, { userId });
      return 0;
    }
  }

  /**
   * Get all active sessions for a user (for "devices" view)
   */
  async getActiveSessions(userId: string) {
    try {
      const tokens = await this.refreshTokenRepository.getActiveTokensForUser(userId);
      
      // Map to a user-friendly format
      return tokens.map((token) => ({
        id: token.id,
        createdAt: token.created_at,
        expiresAt: token.expires_at,
        ipAddress: token.ip_address,
        userAgent: token.user_agent,
      }));
    } catch (error) {
      this.logError('getActiveSessions', error, { userId });
      return [];
    }
  }

  /**
   * Cleanup expired tokens (run as scheduled job)
   * Removes tokens older than the specified date
   */
  async cleanupExpiredTokens(olderThan?: Date): Promise<number> {
    try {
      // Default: cleanup tokens older than 30 days
      const cleanupDate = olderThan || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const count = await this.refreshTokenRepository.cleanupOldTokens(cleanupDate);
      
      this.logInfo('cleanupExpiredTokens', 'Expired tokens cleaned up', { count });
      return count;
    } catch (error) {
      this.logError('cleanupExpiredTokens', error);
      return 0;
    }
  }
}

/**
 * Usage Example:
 * 
 * import { RefreshTokenService } from './services/RefreshTokenService';
 * const refreshTokenService = new RefreshTokenService();
 * 
 * // On login/register
 * const tokens = JWTService.generateTokenPair(payload, env);
 * await refreshTokenService.storeToken(
 *   tokens.refreshToken,
 *   user.id,
 *   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
 *   { userAgent: req.headers['user-agent'], ipAddress: req.ip }
 * );
 * 
 * // On token refresh
 * const tokenData = await refreshTokenService.verifyToken(refreshToken);
 * if (!tokenData) {
 *   throw new UnauthorizedError('Invalid refresh token');
 * }
 * 
 * // Rotate token (recommended for security)
 * await refreshTokenService.rotateToken(
 *   oldRefreshToken,
 *   newRefreshToken,
 *   user.id,
 *   newExpiresAt,
 *   metadata
 * );
 * 
 * // On logout
 * await refreshTokenService.revokeToken(refreshToken);
 * 
 * // On "logout everywhere"
 * await refreshTokenService.revokeAllUserTokens(user.id);
 */

