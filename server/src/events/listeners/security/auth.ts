/**
 * Security listeners for auth domain
 * Monitor suspicious activity, brute force attacks, account anomalies
 */

import {
  onUserLogin,
  onFailedLogin,
} from '../../subscribers/auth.js';
import type {
  UserLoginEventData,
  FailedLoginEventData,
} from '../../../types/events.js';
import logger from '../../../utils/logger.js';

/**
 * Monitor login for suspicious patterns
 */
onUserLogin(async (data: UserLoginEventData) => {
  try {
    logger.debug('[Security] Monitoring login', {
      userId: data.userId,
      ipAddress: data.ipAddress,
    });

    // TODO: Update last login timestamp
    // await userRepository.updateLastLogin(data.userId, data.timestamp);

    // TODO: Check for login anomalies (new device, location, etc.)
    // const isAnomalous = await securityService.checkLoginAnomaly({
    //   userId: data.userId,
    //   ipAddress: data.ipAddress,
    //   userAgent: data.userAgent,
    // });
    // if (isAnomalous) {
    //   await emailService.sendSecurityAlert({
    //     userId: data.userId,
    //     reason: 'Login from new location/device',
    //   });
    // }
  } catch (error) {
    logger.error('[Security] Error monitoring login:', error);
  }
});

/**
 * Track failed login attempts for security monitoring
 */
onFailedLogin(async (data: FailedLoginEventData) => {
  try {
    logger.warn('[Security] Failed login attempt', {
      email: data.email,
      ipAddress: data.ipAddress,
      reason: data.reason,
      timestamp: data.timestamp,
    });

    // TODO: Record failed login attempt
    // await securityService.recordFailedLogin({
    //   email: data.email,
    //   ipAddress: data.ipAddress,
    //   reason: data.reason,
    //   timestamp: data.timestamp,
    // });

    // TODO: Check for brute force attacks
    // const recentFailures = await securityService.getRecentFailedAttempts(data.email);
    // if (recentFailures.count > 5) {
    //   await securityService.lockAccount(data.email);
    //   await emailService.sendAccountLockedEmail(data.email);
    // }

    // TODO: Check for distributed attacks (same IP, multiple accounts)
    // const ipFailures = await securityService.getFailedAttemptsByIP(data.ipAddress);
    // if (ipFailures.count > 10) {
    //   await securityService.blockIP(data.ipAddress);
    // }
  } catch (error) {
    logger.error('[Security] Error tracking failed login:', error);
  }
});

logger.info('[Event Listeners] Auth security listeners initialized');
