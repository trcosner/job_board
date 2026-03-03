import { cleanupOldTokens } from '../../repositories/RefreshTokenRepository/index.js';
import logger from '../../utils/logger.js';

/**
 * Cleanup expired tokens (run as scheduled job)
 * Removes tokens older than the specified date
 */
export async function cleanupExpiredTokens(olderThan?: Date): Promise<number> {
  try {
    const cleanupDate = olderThan || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const count = await cleanupOldTokens(cleanupDate);
    
    logger.info('Expired tokens cleaned up', { count });
    return count;
  } catch (error) {
    logger.error('Failed to cleanup expired tokens', { error });
    return 0;
  }
}
