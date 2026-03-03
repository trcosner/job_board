import { storeToken as storeTokenInDB } from '../../repositories/RefreshTokenRepository/index.js';
import logger from '../../utils/logger.js';

/**
 * Store a new refresh token
 */
export async function storeToken(
  token: string,
  userId: string,
  expiresAt: Date,
  metadata?: { userAgent?: string; ipAddress?: string }
): Promise<boolean> {
  try {
    await storeTokenInDB({
      token,
      userId,
      expiresAt,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    });

    logger.debug('Refresh token stored', { userId, expiresAt });
    return true;
  } catch (error) {
    logger.error('Failed to store refresh token', { error, userId });
    return false;
  }
}
