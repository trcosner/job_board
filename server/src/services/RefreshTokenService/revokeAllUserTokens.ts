import { revokeAllUserTokens as revokeAllTokensInDB } from '../../repositories/RefreshTokenRepository/index.js';
import logger from '../../utils/logger.js';

/**
 * Revoke all refresh tokens for a user (logout everywhere)
 */
export async function revokeAllUserTokens(userId: string): Promise<boolean> {
  try {
    const count = await revokeAllTokensInDB(userId);
    
    logger.info('All user refresh tokens revoked', { userId, count });
    return true;
  } catch (error) {
    logger.error('Failed to revoke all user tokens', { error, userId });
    return false;
  }
}
