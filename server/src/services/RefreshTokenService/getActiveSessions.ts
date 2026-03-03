import { getActiveTokensForUser } from '../../repositories/RefreshTokenRepository/index.js';
import logger from '../../utils/logger.js';

/**
 * Get all active sessions for a user (for "devices" view)
 */
export async function getActiveSessions(userId: string) {
  try {
    const tokens = await getActiveTokensForUser(userId);
    
    // Map to a user-friendly format
    return tokens.map((token) => ({
      id: token.id,
      createdAt: token.created_at,
      expiresAt: token.expires_at,
      ipAddress: token.ip_address,
      userAgent: token.user_agent,
    }));
  } catch (error) {
    logger.error('Failed to get active sessions', { error, userId });
    return [];
  }
}
