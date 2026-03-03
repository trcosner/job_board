import { revokeToken as revokeTokenInDB } from '../../repositories/RefreshTokenRepository/index.js';
import logger from '../../utils/logger.js';

/**
 * Revoke a specific refresh token (single logout)
 */
export async function revokeToken(token: string): Promise<boolean> {
  try {
    const result = await revokeTokenInDB(token);
    
    logger.info('Refresh token revoked', { revoked: result });
    return result;
  } catch (error) {
    logger.error('Failed to revoke token', { error });
    return false;
  }
}
