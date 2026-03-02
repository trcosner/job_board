import bcrypt from 'bcrypt';
import { BaseService } from './BaseService.js';
import { UserRepository, User } from '../repositories/index.js';
import { JWTService } from '../middleware/auth.js';
import { validateEnvironment } from '../config/environment.js';
import { RefreshTokenService } from './RefreshTokenService.js';
import {
  emitUserRegistered,
  emitUserLogin,
  emitUserLogout,
  emitTokenRefreshed,
  emitFailedLogin,
} from '../events/emitters/index.js';
import type {
  UserType,
  UserProfile,
  RegistrationResponse,
  LoginResponse,
  RegistrationRequestParams,
  LoginInput,
  RefreshTokenInput,
} from '../types/index.js';
import { ConflictError } from '../errors/ConflictError.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { authenticationAttempts } from '../config/metrics.js';

/**
 * AuthService handles all authentication business logic
 * Coordinates between repositories, JWT service, and event emitters
 */
export class AuthService extends BaseService {
  private userRepository: UserRepository;
  private refreshTokenService: RefreshTokenService;
  private saltRounds = 12;

  constructor() {
    super();
    this.userRepository = new UserRepository();
    this.refreshTokenService = new RefreshTokenService();
  }

  /**
   * Register a new user
   * - Validates email uniqueness
   * - Hashes password
   * - Creates user in database
   * - Generates JWT tokens
   * - Emits user.registered event
   */
  async register(input: RegistrationRequestParams): Promise<RegistrationResponse> {
    try {
      // Check if email already exists
      const existingUser = await this.userRepository.findByEmail(input.email);
      if (existingUser) {
        authenticationAttempts.labels('register', 'failure').inc();
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, this.saltRounds);

      // Create user (using transaction for safety)
      const user = await this.withTransaction(async (client) => {
        // In a real app, you might also create related records here
        // (e.g., user preferences, initial notification settings)
        return await this.userRepository.create({
          email: input.email.toLowerCase(),
          password_hash: passwordHash,
          first_name: input.firstName,
          last_name: input.lastName,
          user_type: input.userType,
          email_verified: false,
          email_verification_token: null, // TODO: Generate verification token
          verification_token_expires_at: null,
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
      const userProfile = this.mapUserToProfile(user);

      // Emit registration event (for analytics, welcome email, etc.)
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
      await this.refreshTokenService.storeToken(
        tokens.refreshToken,
        user.id,
        refreshTokenExpiry
      );

      // Record successful registration
      authenticationAttempts.labels('register', 'success').inc();

      this.logInfo('AuthService.register', `User registered: ${user.email}`, {
        userId: user.id,
        userType: user.user_type,
      });

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
      this.logError('AuthService.register', error, { email: input.email });
      throw error;
    }
  }

  /**
   * Login an existing user
   * - Finds user by email
   * - Verifies password
   * - Generates JWT tokens
   * - Emits user.login event
   */
  async login(input: LoginInput): Promise<LoginResponse> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(input.email);
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

      // TODO: Check if user is active, not banned, etc.
      // TODO: Check if email is verified (optional based on requirements)
      
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
      const userProfile = this.mapUserToProfile(user);

      // Emit login event (for analytics, security monitoring)
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
      await this.refreshTokenService.storeToken(
        tokens.refreshToken,
        user.id,
        refreshTokenExpiry,
        {
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        }
      );

      // Record successful login
      authenticationAttempts.labels('login', 'success').inc();

      this.logInfo('AuthService.login', `User logged in: ${user.email}`, {
        userId: user.id,
      });

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
      this.logError('AuthService.login', error, { email: input.email });
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * - Verifies refresh token
   * - Checks token is not revoked (TODO)
   * - Generates new token pair
   * - Emits token.refreshed event
   */
  async refreshToken(input: RefreshTokenInput): Promise<{
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
      const tokenData = await this.refreshTokenService.verifyToken(input.refreshToken);
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

      // Rotate refresh token (revoke old, store new, link them)
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await this.refreshTokenService.rotateToken(
        input.refreshToken,
        newTokens.refreshToken,
        payload.userId,
        refreshTokenExpiry
      );

      // Emit token refresh event
      emitTokenRefreshed({
        userId: payload.userId,
        email: payload.email,
        timestamp: new Date(),
      });

      this.logInfo('AuthService.refreshToken', `Token refreshed for user: ${payload.email}`, {
        userId: payload.userId,
      });

      return {
        message: 'Tokens refreshed successfully',
        ...newTokens,
      };
    } catch (error) {
      this.logError('AuthService.refreshToken', error);
      throw error;
    }
  }

  /**
   * Get user profile by ID
   * - Fetches user from database
   * - Returns user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      return this.mapUserToProfile(user);
    } catch (error) {
      this.logError('AuthService.getUserProfile', error, { userId });
      throw error;
    }
  }

  /**
   * Logout user
   * - Revokes refresh token
   * - Optionally adds access token to blacklist (TODO)
   * - Emits user.logout event
   */
  async logout(userId: string, email: string, refreshToken?: string): Promise<void> {
    try {
      // Revoke the specific refresh token if provided
      if (refreshToken) {
        await this.refreshTokenService.revokeToken(refreshToken);
      }
      
      // TODO: Add access token to blacklist in Redis
      // This would prevent the access token from being used until it expires
      // await redisService.blacklistToken(accessToken, expiresIn);

      // Emit logout event
      emitUserLogout({
        userId,
        email,
        timestamp: new Date(),
      });

      this.logInfo('AuthService.logout', `User logged out: ${email}`, { userId });
    } catch (error) {
      this.logError('AuthService.logout', error, { userId });
      throw error;
    }
  }

  /**
   * Map User entity to UserProfile
   */
  private mapUserToProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      userType: user.user_type,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
    };
  }
}
