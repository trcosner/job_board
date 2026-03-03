import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { Environment } from '../config/environment.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { ForbiddenError } from '../errors/ForbiddenError.js';
import { UserType } from '../types/auth.js';

export interface JWTPayload {
  userId: string;
  email: string;
  userType: UserType;
  role?: string; // Optional: For future fine-grained permissions (e.g., 'moderator', 'support')
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * JWT utility functions for token management
 * Staff-level authentication with access/refresh token pattern
 */
export class JWTService {
  private static ACCESS_TOKEN_EXPIRES = '15m';
  private static REFRESH_TOKEN_EXPIRES = '7d';

  /**
   * Generate access token (short-lived)
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, env: Environment): string {
    return jwt.sign(payload, env.JWT_SECRET as string, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES,
      issuer: 'job-board-api',
      audience: 'job-board-client'
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token (long-lived)
   */
  static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, env: Environment): string {
    return jwt.sign(payload, env.JWT_SECRET as string, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES,
      issuer: 'job-board-api',
      audience: 'job-board-client'
    } as jwt.SignOptions);
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>, env: Environment): TokenPair {
    const accessToken = this.generateAccessToken(payload, env);
    const refreshToken = this.generateRefreshToken(payload, env);
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string, env: Environment): JWTPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        issuer: 'job-board-api',
        audience: 'job-board-client'
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw new UnauthorizedError('Token verification failed');
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader?: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }
    
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request
 * Use this for any route that requires authentication
 */
export const authenticateToken = (env: Environment) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const token = JWTService.extractTokenFromHeader(req.headers.authorization);
      const payload = JWTService.verifyToken(token, env);
      
      // Add user info to request
      req.user = {
        id: payload.userId,
        email: payload.email,
        userType: payload.userType,
        role: payload.role,
        emailVerified: true // Assume verified if they have a token
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Alias for authenticateToken - simpler name
 * Usage: router.get('/protected', requireAuth(env), controller)
 */
export const requireAuth = authenticateToken;

/**
 * Authorization middleware - requires specific user types
 * Our main role system uses userType (JOB_SEEKER, EMPLOYER, ADMIN)
 * 
 * Usage:
 *   router.post('/jobs', requireAuth(env), requireUserType(UserType.EMPLOYER), createJobController)
 *   router.get('/admin', requireAuth(env), requireUserType(UserType.ADMIN), adminController)
 */
export const requireUserType = (...allowedTypes: UserType[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return next(new ForbiddenError(`Access restricted to: ${allowedTypes.join(', ')}`));
    }

    next();
  };
};

/**
 * Optional fine-grained role-based authorization
 * This is for future use if you need permissions beyond userType
 * (e.g., 'moderator', 'support_agent', 'billing_admin')
 * 
 * For now, prefer using requireUserType for most authorization needs
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient role permissions'));
    }

    next();
  };
};

/**
 * Require employer user type.
 * Shorthand for requireUserType('employer').
 * Must be used AFTER requireAuth.
 */
export const requireEmployer = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }
  if (req.user.userType !== 'employer') {
    return next(new ForbiddenError('This action is restricted to employers'));
  }
  next();
};

/**
 * Require job seeker user type.
 * Shorthand for requireUserType('job_seeker').
 * Must be used AFTER requireAuth.
 */
export const requireJobSeeker = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }
  if (req.user.userType !== 'job_seeker') {
    return next(new ForbiddenError('This action is restricted to job seekers'));
  }
  next();
};

/**
 * Require that the employer has completed onboarding (i.e. created their company profile).
 * Must be used AFTER requireAuth.
 *
 * Usage:
 *   router.post('/jobs', requireAuth(env), requireOnboardingComplete, createJobController)
 */
export const requireOnboardingComplete = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }
  if (req.user.userType !== 'employer') {
    return next(new ForbiddenError('Onboarding applies to employer accounts only'));
  }
  try {
    const { findById } = await import('../repositories/UserRepository/index.js');
    const user = await findById(req.user.id);
    if (!user?.onboarding_completed) {
      return next(
        new ForbiddenError(
          'You must complete company onboarding before performing this action'
        )
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require the authenticated employer to have an associated company.
 * Must be used AFTER requireAuth / authenticateToken so req.user is populated.
 *
 * Usage:
 *   router.post('/jobs', requireAuth(env), requireCompany, createJobController)
 */
export const requireCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (req.user.userType !== 'employer') {
    return next(new ForbiddenError('Only employers can perform this action'));
  }

  try {
    // Lazy import to avoid circular deps at module load time
    const { findById } = await import('../repositories/UserRepository/index.js');
    const user = await findById(req.user.id);

    if (!user?.company_id) {
      return next(
        new ForbiddenError(
          'You must create a company profile before performing this action'
        )
      );
    }

    // Attach company_id for downstream use without an extra DB round-trip
    (req as any).companyId = user.company_id;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Adds user to request if token is valid, but doesn't require it
 * 
 * Use cases:
 * - Public job listings (show "Apply" button if authenticated)
 * - Public profiles (show "Message" button if authenticated)
 * - Homepage (show personalized content if logged in)
 * 
 * Usage:
 *   router.get('/jobs', optionalAuth(env), listJobsController)
 */
export const optionalAuth = (env: Environment) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = JWTService.extractTokenFromHeader(authHeader);
        const payload = JWTService.verifyToken(token, env);
        
        req.user = {
          id: payload.userId,
          email: payload.email,
          userType: payload.userType,
          role: payload.role,
          emailVerified: true
        };
      }
    } catch (error) {
      // Ignore auth errors in optional auth - user just remains unauthenticated
    }
    
    next();
  };
};