import { UserType } from './auth';

/**
 * Base interface for all domain events
 */
export interface BaseDomainEventData {
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * User registration event data
 */
export interface UserRegisteredEventData extends BaseDomainEventData {
  userId: string;
  email: string;
  userType: UserType;
  firstName: string;
  lastName: string;
}

/**
 * User login event data
 */
export interface UserLoginEventData extends BaseDomainEventData {
  userId: string;
  email: string;
  userType: UserType;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * User logout event data
 */
export interface UserLogoutEventData extends BaseDomainEventData {
  userId: string;
  email: string;
}

/**
 * Token refresh event data
 */
export interface TokenRefreshedEventData extends BaseDomainEventData {
  userId: string;
  email: string;
}

/**
 * Failed login attempt event data
 */
export interface FailedLoginEventData extends BaseDomainEventData {
  email: string;
  ipAddress?: string;
  reason: string;
}

/**
 * Job-related event data types
 * TODO: Add job event data types as needed
 */
export interface JobViewedEventData extends BaseDomainEventData {
  jobId: string;
  userId?: string;
}

export interface JobApplicationSubmittedEventData extends BaseDomainEventData {
  jobId: string;
  userId: string;
  applicantEmail: string;
}
