/**
 * Auth domain event emitters
 * Type-safe emitters for all auth-related events
 */

import { DomainEvent, createEventEmitter } from '../eventBus.js';
import type {
  UserRegisteredEventData,
  UserLoginEventData,
  UserLogoutEventData,
  TokenRefreshedEventData,
  FailedLoginEventData,
} from '../../types/events.js';

/**
 * Emit user registered event
 */
export const emitUserRegistered = createEventEmitter<UserRegisteredEventData>(
  DomainEvent.USER_REGISTERED
);

/**
 * Emit user login event
 */
export const emitUserLogin = createEventEmitter<UserLoginEventData>(
  DomainEvent.USER_LOGIN
);

/**
 * Emit user logout event
 */
export const emitUserLogout = createEventEmitter<UserLogoutEventData>(
  DomainEvent.USER_LOGOUT
);

/**
 * Emit token refreshed event
 */
export const emitTokenRefreshed = createEventEmitter<TokenRefreshedEventData>(
  DomainEvent.TOKEN_REFRESHED
);

/**
 * Emit failed login attempt event
 */
export const emitFailedLogin = createEventEmitter<FailedLoginEventData>(
  DomainEvent.FAILED_LOGIN_ATTEMPT
);
