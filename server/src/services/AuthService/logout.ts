import { revokeToken } from '../RefreshTokenService/revokeToken.js';
import { emitUserLogout } from '../../events/emitters/index.js';
import logger from '../../utils/logger.js';

/**
 * Logout user
 * - Revokes refresh token
 * - Emits user.logout event
 */
export async function logout(userId: string, email: string, refreshToken?: string): Promise<void> {
  try {
    // Revoke the specific refresh token if provided
    if (refreshToken) {
      await revokeToken(refreshToken);
    }

    // Emit logout event
    emitUserLogout({
      userId,
      email,
      timestamp: new Date(),
    });

    logger.info('User logged out', { userId });
  } catch (error) {
    logger.error('Logout failed', { error, userId });
    throw error;
  }
}
