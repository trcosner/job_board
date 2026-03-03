export interface RegistrationRequestParams {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: UserType;
}

export interface LoginRequestParams {
    email: string;
    password: string;
}

/**
 * Extended login params with extra context for logging/security
 */
export interface LoginInput extends LoginRequestParams {
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Token refresh input
 */
export interface RefreshTokenInput {
    refreshToken: string;
}

export interface AuthResponse {
    message: string;
    user: UserProfile;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
}

export interface RegistrationResponse extends AuthResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface LoginResponse extends AuthResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: UserType;
    emailVerified: boolean;
    createdAt: Date;
}

export type UserType = 'job_seeker' | 'employer';

// JWT payload interface
export interface JWTPayload {
    userId: string;
    email: string;
    userType: UserType;
    iat?: number;
    exp?: number;
}

/**
 * Refresh token entity matching the database schema
 */
export interface RefreshToken {
  id: string;
  token_hash: string;
  user_id: string;
  expires_at: Date;
  revoked_at: Date | null;
  revoked_by_token_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface CreateRefreshTokenInput {
  token: string; // Plain token (will be hashed)
  userId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}