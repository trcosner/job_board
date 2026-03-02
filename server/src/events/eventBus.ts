import { EventEmitter } from 'events';
import logger from '../utils/logger.js';
import type { BaseDomainEventData } from '../types/events.js';

/**
 * Domain events that can be emitted throughout the application
 * Organized by domain for easy extension
 */
export enum DomainEvent {
  // User events
  USER_REGISTERED = 'user.registered',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_EMAIL_VERIFIED = 'user.email_verified',
  USER_PASSWORD_CHANGED = 'user.password_changed',
  USER_PROFILE_UPDATED = 'user.profile_updated',
  USER_DELETED = 'user.deleted',
  
  // Job events
  JOB_CREATED = 'job.created',
  JOB_UPDATED = 'job.updated',
  JOB_DELETED = 'job.deleted',
  JOB_VIEWED = 'job.viewed',
  JOB_APPLICATION_SUBMITTED = 'job.application_submitted',
  
  // Auth events
  TOKEN_REFRESHED = 'auth.token_refreshed',
  FAILED_LOGIN_ATTEMPT = 'auth.failed_login',
  FAILED_REGISTRATION_ATTEMPT = 'auth.failed_registration',
}

/**
 * Type-safe event emitter function type
 */
export type EventEmitterFn<T extends BaseDomainEventData> = (data: T) => boolean;

/**
 * Type-safe event listener function type
 */
export type EventListenerFn<T extends BaseDomainEventData> = (data: T) => void | Promise<void>;

/**
 * Type-safe event subscriber function type
 */
export type EventSubscriberFn<T extends BaseDomainEventData> = (
  listener: EventListenerFn<T>
) => EventEmitter;

/**
 * Application-wide event bus
 * Singleton pattern to ensure single instance
 */
class ApplicationEventBus extends EventEmitter {
  private static instance: ApplicationEventBus;

  private constructor() {
    super();
    // Increase max listeners for production
    this.setMaxListeners(100);
    
    // Log all events in development
    if (process.env.NODE_ENV === 'development') {
      this.onAny((event: string, data: any) => {
        logger.debug(`Event emitted: ${event}`, { data });
      });
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ApplicationEventBus {
    if (!ApplicationEventBus.instance) {
      ApplicationEventBus.instance = new ApplicationEventBus();
    }
    return ApplicationEventBus.instance;
  }

  /**
   * Listen to any event (useful for logging/debugging)
   */
  onAny(listener: (event: string, data: any) => void): void {
    const events = Object.values(DomainEvent);
    events.forEach((event) => {
      this.on(event, (data) => listener(event, data));
    });
  }

  /**
   * Emit an event with error handling
   */
  emitEvent<T extends BaseDomainEventData>(event: DomainEvent, data: T): boolean {
    try {
      return this.emit(event, data);
    } catch (error) {
      logger.error(`Error emitting event ${event}:`, error);
      return false;
    }
  }

  /**
   * Subscribe to an event with error handling
   */
  subscribeToEvent<T extends BaseDomainEventData>(
    event: DomainEvent,
    listener: EventListenerFn<T>
  ): EventEmitter {
    const wrappedListener = async (data: T) => {
      try {
        await listener(data);
      } catch (error) {
        logger.error(`Error in event listener for ${event}:`, error);
      }
    };
    return this.on(event, wrappedListener);
  }
}

// Export singleton instance
export const eventBus = ApplicationEventBus.getInstance();

/**
 * Helper to create a type-safe event emitter
 */
export function createEventEmitter<T extends BaseDomainEventData>(
  event: DomainEvent
): EventEmitterFn<T> {
  return (data: T) => eventBus.emitEvent(event, data);
}

/**
 * Helper to create a type-safe event subscriber
 */
export function createEventSubscriber<T extends BaseDomainEventData>(
  event: DomainEvent
): EventSubscriberFn<T> {
  return (listener: EventListenerFn<T>) => eventBus.subscribeToEvent(event, listener);
}
