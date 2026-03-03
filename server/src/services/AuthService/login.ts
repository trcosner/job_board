import bcrypt from 'bcrypt';
import { findByEmail } from '../../repositories/UserRepository/index.js';
import { JWTService } from '../../middleware/auth.js';
import { validateEnvironment } from '../../config/environment.js';
import { storeToken } from '../RefreshTokenService/storeToken.js';
import { emitUserLogin, emitFailedLogin } from '../../events/emitters/index.js';
import type { LoginInput, LoginResponse } from '../../types/index.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import { authenticationAttempts } from '../../config/metrics.js';
import { mapUserToProfile } from './utils/index.js';
import logger from '../../utils/logger.js';

/**
 * Login an existing user
 * - Finds user by email
 * - Verifies password
 * - Generates JWT tokens
 * - Emits user.login event
 */
export async function login(input: LoginInput): Promise<LoginResponse> {
  try {
    const user = await findByEmail(input.email);
    if (!user) {
      authenticationAttempts.labels('login', 'failure').inc();
      emitFailedLogin({
        email: input.email,
        ipAddress: input.ipAddress,
        reason: 'User not found',
        timestamp: new Date(),
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
    if (!isPasswordValid) {
      authenticationAttempts.labels('login', 'failure').inc();
      emitFailedLogin({
        email: input.email,
        ipAddress: input.ipAddress,
        reason: 'Invalid password',
        timestamp: new Date(),
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate JWT tokens
    const env = validateEnvironment();
    const tokens = JWTService.generateTokenPair(
      {
        userId: user.id,
        email: user.email,
        userType: user.user_type,
      },
      env
    );

    // Build user profile
    const userProfile = mapUserToProfile(user);

    // Emit login event
    emitUserLogin({
      userId: user.id,
      email: user.email,
      userType: user.user_type,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      timestamp: new Date(),
    });

    // Store refresh token in database with metadata
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await storeToken(tokens.refreshToken, user.id, refreshTokenExpiry, {
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    // Record successful login
    authenticationAttempts.labels('login', 'success').inc();

    logger.info('User logged in', { userId: user.id });

    return {
      message: 'Login successful',
      user: userProfile,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    authenticationAttempts.labels('login', 'failure').inc();
    logger.error('Login failed', { error, email: input.email });
    throw error;
  }
}
