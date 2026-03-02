/**
 * Notification listeners for auth domain
 * Handle email, SMS, push notifications for auth events
 * (e.g., welcome emails, password reset, security alerts)
 */

import {
  onUserRegistered,
} from '../../subscribers/auth.js';
import type {
  UserRegisteredEventData,
} from '../../../types/events.js';
import logger from '../../../utils/logger.js';

/**
 * Send welcome email when user registers
 */
onUserRegistered(async (data: UserRegisteredEventData) => {
  try {
    logger.info('[Notifications] Sending welcome email', {
      userId: data.userId,
      email: data.email,
    });

    // TODO: Send welcome email
    // await emailService.sendWelcomeEmail({
    //   to: data.email,
    //   firstName: data.firstName,
    //   lastName: data.lastName,
    //   userType: data.userType,
    // });

    // TODO: Send to onboarding service
    // await onboardingService.createInitialTasks(data.userId);
  } catch (error) {
    logger.error('[Notifications] Error sending welcome email:', error);
  }
});

logger.info('[Event Listeners] Auth notification listeners initialized');
