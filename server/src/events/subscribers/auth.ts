/**
 * Auth domain event subscribers
 * Type-safe subscribers for all auth-related events
 */

import { DomainEvent, createEventSubscriber } from '../eventBus.js';
import type {
  UserRegisteredEventData,
  UserLoginEventData,
  UserLogoutEventData,
  TokenRefreshedEventData,
  FailedLoginEventData,
} from '../../types/events.js';

/**
 * Subscribe to user registered event
 */
export const onUserRegistered = createEventSubscriber<UserRegisteredEventData>(
  DomainEvent.USER_REGISTERED
);

/**
 * Subscribe to user login event
 */
export const onUserLogin = createEventSubscriber<UserLoginEventData>(
  DomainEvent.USER_LOGIN
);

/**
 * Subscribe to user logout event
 */
export const onUserLogout = createEventSubscriber<UserLogoutEventData>(
  DomainEvent.USER_LOGOUT
);

/**
 * Subscribe to token refreshed event
 */
export const onTokenRefreshed = createEventSubscriber<TokenRefreshedEventData>(
  DomainEvent.TOKEN_REFRESHED
);

/**
 * Subscribe to failed login attempt event
 */
export const onFailedLogin = createEventSubscriber<FailedLoginEventData>(
  DomainEvent.FAILED_LOGIN_ATTEMPT
);
