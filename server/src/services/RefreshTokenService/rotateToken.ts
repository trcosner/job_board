import { rotateToken as rotateTokenInDB } from '../../repositories/RefreshTokenRepository/index.js';
import logger from '../../utils/logger.js';

/**
 * Rotate refresh token (revoke old, issue new, link them)
 * Used during token refresh to implement token rotation security
 */
export async function rotateToken(
  oldToken: string,
  newToken: string,
  userId: string,
  expiresAt: Date,
  metadata?: { userAgent?: string; ipAddress?: string }
): Promise<boolean> {
  try {
    await rotateTokenInDB(oldToken, {
      token: newToken,
      userId,
      expiresAt,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });

    logger.debug('Token rotated successfully', { userId });
    return true;
  } catch (error) {
    logger.error('Failed to rotate token', { error, userId });
    return false;
  }
}
