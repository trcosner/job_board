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