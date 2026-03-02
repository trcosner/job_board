/**
 * Application Constants
 * Configuration values used throughout the client application
 */

/**
 * API Configuration
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  // Health endpoints
  HEALTH: {
    STATUS: '/health',
    READINESS: '/health/readiness',
    LIVENESS: '/health/liveness',
  },
  // Job endpoints (future)
  JOBS: {
    LIST: '/jobs',
    DETAIL: (id: string) => `/jobs/${id}`,
    APPLY: (id: string) => `/jobs/${id}/apply`,
  },
} as const;

/**
 * Application Routes (Client-side)
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  JOBS: '/jobs',
  JOB_DETAIL: (id: string) => `/jobs/${id}`,
  PROFILE: '/profile',
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'job_board_access_token',
  REFRESH_TOKEN: 'job_board_refresh_token',
  USER: 'job_board_user',
} as const;

/**
 * Token Configuration
 */
export const TOKEN_CONFIG = {
  // Access token expires in 15 minutes (from server config)
  ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // milliseconds
  // Refresh token expires in 7 days (from server config)
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // milliseconds
  // Refresh token if it expires in less than 5 minutes
  REFRESH_THRESHOLD: 5 * 60 * 1000, // milliseconds
} as const;

/**
 * Validation Rules (must match server)
 */
export const VALIDATION = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 255,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    // At least one uppercase, one lowercase, one number
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z\s'-]+$/,
  },
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'Your session has expired. Please login again.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  REGISTRATION: 'Account created successfully! Welcome to Job Board.',
  LOGIN: 'Welcome back!',
  LOGOUT: 'Logged out successfully.',
  PROFILE_UPDATE: 'Profile updated successfully.',
} as const;
