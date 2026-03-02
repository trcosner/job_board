/**
 * Auth Types - Client Side
 * Matching server types from server/src/types/auth.ts
 */

export type UserType = 'job_seeker' | 'employer';

/**
 * User Profile - matches server UserProfile
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  emailVerified: boolean;
  createdAt: string; // Date serialized as string from API
}

/**
 * Registration Request Params
 */
export interface RegistrationRequestParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: UserType;
}

/**
 * Login Request Params
 */
export interface LoginRequestParams {
  email: string;
  password: string;
}

/**
 * Token Refresh Input
 */
export interface RefreshTokenInput {
  refreshToken: string;
}

/**
 * Base Auth Response
 */
export interface AuthResponse {
  message: string;
  user: UserProfile;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * Registration Response - includes tokens
 */
export interface RegistrationResponse extends AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Login Response - includes tokens
 */
export interface LoginResponse extends AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * JWT Payload (decoded token)
 */
export interface JWTPayload {
  userId: string;
  email: string;
  userType: UserType;
  iat?: number;
  exp?: number;
}

/**
 * Auth Context State
 */
export interface AuthContextState {
  user: UserProfile | null;
  loading: boolean;
  login: (params: LoginRequestParams) => Promise<LoginResponse>;
  register: (params: RegistrationRequestParams) => Promise<RegistrationResponse>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}
