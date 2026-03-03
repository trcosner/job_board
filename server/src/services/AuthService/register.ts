import bcrypt from 'bcrypt';
import { findByEmail, create as createUser } from '../../repositories/UserRepository/index.js';
import { JWTService } from '../../middleware/auth.js';
import { validateEnvironment } from '../../config/environment.js';
import { storeToken } from '../RefreshTokenService/storeToken.js';
import { withTransaction } from '../../utils/transactions.js';
import { emitUserRegistered } from '../../events/emitters/index.js';
import type { RegistrationRequestParams, RegistrationResponse } from '../../types/index.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { authenticationAttempts } from '../../config/metrics.js';
import { mapUserToProfile } from './utils/index.js';
import logger from '../../utils/logger.js';

const SALT_ROUNDS = 12;

/**
 * Register a new user
 * - Validates email uniqueness
 * - Hashes password
 * - Creates user in database
 * - Generates JWT tokens
 * - Emits user.registered event
 */
export async function register(input: RegistrationRequestParams): Promise<RegistrationResponse> {
  try {
    const existingUser = await findByEmail(input.email.toLowerCase());
    if (existingUser) {
      authenticationAttempts.labels('register', 'failure').inc();
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user using transaction
    const user = await withTransaction(async () => {
      return await createUser({
        email: input.email.toLowerCase(),
        password_hash: passwordHash,
        first_name: input.firstName,
        last_name: input.lastName,
        user_type: input.userType,
        email_verified: false,
        email_verification_token: null,
        verification_token_expires_at: null,
        company_id: null,
        onboarding_completed: false,
      });
    });

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

    // Emit registration event
    emitUserRegistered({
      userId: user.id,
      email: user.email,
      userType: user.user_type,
      firstName: user.first_name,
      lastName: user.last_name,
      timestamp: new Date(),
    });

    // Store refresh token in database
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await storeToken(tokens.refreshToken, user.id, refreshTokenExpiry);

    // Record successful registration
    authenticationAttempts.labels('register', 'success').inc();

    logger.info('User registered', { userId: user.id, userType: user.user_type });

    return {
      message: 'User registered successfully',
      user: userProfile,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  } catch (error) {
    if (error instanceof ConflictError) {
      throw error;
    }
    authenticationAttempts.labels('register', 'failure').inc();
    logger.error('Registration failed', { error, email: input.email });
    throw error;
  }
}
