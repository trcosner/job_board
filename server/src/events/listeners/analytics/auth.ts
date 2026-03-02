/**
 * Analytics listeners for auth domain
 * Pure analytics tracking - send events to analytics platforms
 * (e.g., Mixpanel, Segment, Google Analytics, Amplitude, etc.)
 */

import {
  onUserRegistered,
  onUserLogin,
  onUserLogout,
  onTokenRefreshed,
} from '../../subscribers/auth.js';
import type {
  UserRegisteredEventData,
  UserLoginEventData,
  UserLogoutEventData,
  TokenRefreshedEventData,
} from '../../../types/events.js';
import logger from '../../../utils/logger.js';

/**
 * Track user registration for analytics
 */
onUserRegistered(async (data: UserRegisteredEventData) => {
  try {
    logger.info('[Analytics] User registered', {
      userId: data.userId,
      userType: data.userType,
      timestamp: data.timestamp,
    });

    // TODO: Send to analytics platform
    // await analytics.track({
    //   userId: data.userId,
    //   event: 'User Registered',
    //   properties: {
    //     email: data.email,
    //     userType: data.userType,
    //     firstName: data.firstName,
    //     lastName: data.lastName,
    //   },
    // });
  } catch (error) {
    logger.error('[Analytics] Error tracking user registration:', error);
  }
});

/**
 * Track user login for analytics
 */
onUserLogin(async (data: UserLoginEventData) => {
  try {
    logger.info('[Analytics] User logged in', {
      userId: data.userId,
      userType: data.userType,
      ipAddress: data.ipAddress,
      timestamp: data.timestamp,
    });

    // TODO: Send to analytics platform
    // await analytics.track({
    //   userId: data.userId,
    //   event: 'User Logged In',
    //   properties: {
    //     userType: data.userType,
    //     ipAddress: data.ipAddress,
    //     userAgent: data.userAgent,
    //   },
    // });
  } catch (error) {
    logger.error('[Analytics] Error tracking user login:', error);
  }
});

/**
 * Track user logout for analytics
 */
onUserLogout(async (data: UserLogoutEventData) => {
  try {
    logger.info('[Analytics] User logged out', {
      userId: data.userId,
      timestamp: data.timestamp,
    });

    // TODO: Send to analytics platform
    // await analytics.track({
    //   userId: data.userId,
    //   event: 'User Logged Out',
    // });
  } catch (error) {
    logger.error('[Analytics] Error tracking user logout:', error);
  }
});

/**
 * Track token refresh for analytics (session extension)
 */
onTokenRefreshed(async (data: TokenRefreshedEventData) => {
  try {
    logger.debug('[Analytics] Token refreshed', {
      userId: data.userId,
      timestamp: data.timestamp,
    });

    // TODO: Track session extension
    // await analytics.track({
    //   userId: data.userId,
    //   event: 'Session Extended',
    // });
  } catch (error) {
    logger.error('[Analytics] Error tracking token refresh:', error);
  }
});

logger.info('[Event Listeners] Auth analytics listeners initialized');
