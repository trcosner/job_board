import { JWTService } from '../../middleware/auth.js';
import { validateEnvironment } from '../../config/environment.js';
import { verifyToken } from '../RefreshTokenService/verifyToken.js';
import { rotateToken } from '../RefreshTokenService/rotateToken.js';
import { emitTokenRefreshed } from '../../events/emitters/index.js';
import type { RefreshTokenInput } from '../../types/index.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import logger from '../../utils/logger.js';

/**
 * Refresh access token using refresh token
 * - Verifies refresh token
 * - Checks token is not revoked
 * - Generates new token pair
 * - Emits token.refreshed event
 */
export async function refreshToken(input: RefreshTokenInput): Promise<{
  message: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  try {
    const env = validateEnvironment();
    
    // Verify refresh token (JWT signature)
    const payload = JWTService.verifyToken(input.refreshToken, env);

    // Verify refresh token exists in database and is not revoked
    const tokenData = await verifyToken(input.refreshToken);
    if (!tokenData) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Generate new token pair
    const newTokens = JWTService.generateTokenPair(
      {
        userId: payload.userId,
        email: payload.email,
        userType: payload.userType,
        role: payload.role,
      },
      env
    );

    // Rotate refresh token (revoke old, store new)
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await rotateToken(input.refreshToken, newTokens.refreshToken, payload.userId, refreshTokenExpiry);

    // Emit token refresh event
    emitTokenRefreshed({
      userId: payload.userId,
      email: payload.email,
      timestamp: new Date(),
    });

    logger.info('Token refreshed', { userId: payload.userId });

    return {
      message: 'Tokens refreshed successfully',
      ...newTokens,
    };
  } catch (error) {
    logger.error('Token refresh failed', { error });
    throw error;
  }
}
