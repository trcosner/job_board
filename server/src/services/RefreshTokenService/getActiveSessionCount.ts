import { countActiveTokensForUser } from '../../repositories/RefreshTokenRepository/index.js';
import logger from '../../utils/logger.js';

/**
 * Get active session count for a user
 */
export async function getActiveSessionCount(userId: string): Promise<number> {
  try {
    return await countActiveTokensForUser(userId);
  } catch (error) {
    logger.error('Failed to get active session count', { error, userId });
    return 0;
  }
}
