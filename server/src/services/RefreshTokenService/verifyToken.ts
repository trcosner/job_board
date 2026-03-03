import { findByToken } from '../../repositories/RefreshTokenRepository/index.js';
import logger from '../../utils/logger.js';

/**
 * Verify and retrieve refresh token
 * Returns token data if valid, null if token doesn't exist, is revoked, or expired
 */
export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const tokenData = await findByToken(token);
    
    if (!tokenData) {
      logger.debug('Token not found or invalid');
      return null;
    }

    return { userId: tokenData.user_id };
  } catch (error) {
    logger.error('Failed to verify token', { error });
    return null;
  }
}
