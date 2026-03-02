/**
 * Client-side analytics helper
 * Tracks events and sends them to backend API in batches
 */

import type { AnalyticsEventName } from '../types/analytics';

// Configuration
const ANALYTICS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const BATCH_SIZE = 10; // Send batch after 10 events
const BATCH_INTERVAL = 5000; // Or after 5 seconds
const SESSION_STORAGE_KEY = 'analytics_session_id';

interface EventOptions {
  properties?: Record<string, any>;
  immediate?: boolean; // Skip batching and send immediately
}

interface QueuedEvent {
  eventName: AnalyticsEventName | string;
  timestamp: string;
  properties?: Record<string, any>;
}

// Event queue and timer
let eventQueue: QueuedEvent[] = [];
let flushTimer: NodeJS.Timeout | null = null;
let sessionId: string | null = null;

/**
 * Get or create session ID
 * Session ID persists for the browser session (tab lifetime)
 */
function getSessionId(): string {
  if (sessionId) return sessionId;
  
  // Check if we're in browser environment
  if (typeof window === 'undefined') return 'ssr-session';
  
  // Try to get existing session ID
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      sessionId = stored;
      return stored;
    }
  } catch (error) {
    // SessionStorage might be blocked
    console.warn('[Analytics] SessionStorage not available:', error);
  }
  
  // Generate new session ID
  sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch (error) {
    // Ignore storage errors
  }
  
  return sessionId;
}

/**
 * Send events to backend API
 */
async function sendEvents(events: QueuedEvent[]): Promise<void> {
  if (events.length === 0) return;
  
  const payload = {
    sessionId: getSessionId(),
    events,
  };
  
  try {
    // Use fetch for normal requests
    const response = await fetch(`${ANALYTICS_API_URL}/analytics/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // Don't include credentials for analytics (public endpoint)
      credentials: 'omit',
    });
    
    if (!response.ok) {
      console.warn('[Analytics] Failed to send events:', response.status);
    }
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.warn('[Analytics] Error sending events:', error);
  }
}

/**
 * Flush the event queue
 */
function flushQueue(): void {
  if (eventQueue.length === 0) return;
  
  const eventsToSend = [...eventQueue];
  eventQueue = [];
  
  // Cancel existing timer
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  
  // Send events
  sendEvents(eventsToSend);
}

/**
 * Schedule a flush if not already scheduled
 */
function scheduleFlush(): void {
  if (flushTimer) return;
  
  flushTimer = setTimeout(() => {
    flushQueue();
  }, BATCH_INTERVAL);
}

/**
 * Track an analytics event
 * Events are batched automatically for efficiency
 */
export function trackEvent(
  eventName: AnalyticsEventName | string,
  options: EventOptions = {}
): void {
  // Skip in SSR
  if (typeof window === 'undefined') return;
  
  const event: QueuedEvent = {
    eventName,
    timestamp: new Date().toISOString(),
    properties: options.properties,
  };
  
  // Immediate send (e.g., for critical events like errors)
  if (options.immediate) {
    sendEvents([event]);
    return;
  }
  
  // Add to queue
  eventQueue.push(event);
  
  // Flush if batch size reached
  if (eventQueue.length >= BATCH_SIZE) {
    flushQueue();
  } else {
    scheduleFlush();
  }
}

/**
 * Track page view
 * Convenience method for page view events
 */
export function trackPageView(path: string, title?: string): void {
  trackEvent('page_view', {
    properties: {
      path,
      title: title || document.title,
      referrer: document.referrer,
    },
  });
}

/**
 * Track client-side error
 * Sends immediately (not batched)
 */
export function trackError(
  error: Error,
  errorInfo?: { componentStack?: string }
): void {
  // Skip in SSR
  if (typeof window === 'undefined') return;
  
  try {
    fetch(`${ANALYTICS_API_URL}/analytics/error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo,
        page: window.location.pathname,
      }),
      credentials: 'omit',
    });
  } catch (err) {
    // Silently fail
    console.warn('[Analytics] Error sending error:', err);
  }
}

/**
 * Initialize analytics event listeners
 * Call this from a useEffect to avoid SSR hydration mismatch
 */
let isInitialized = false;

export function initializeAnalytics(): void {
  // Skip if already initialized or not in browser
  if (isInitialized || typeof window === 'undefined') return;
  
  isInitialized = true;
  
  // Flush queue on page unload
  window.addEventListener('beforeunload', () => {
    if (eventQueue.length === 0) return;
    
    const payload = {
      sessionId: getSessionId(),
      events: eventQueue,
    };
    
    // Try sendBeacon first (more reliable on page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: 'application/json',
      });
      navigator.sendBeacon(`${ANALYTICS_API_URL}/analytics/batch`, blob);
    } else {
      // Fallback to synchronous fetch
      fetch(`${ANALYTICS_API_URL}/analytics/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
    
    eventQueue = [];
  });
}

/**
 * Manually flush the queue
 * Useful for testing or ensuring events are sent before navigation
 */
export function flushAnalytics(): void {
  flushQueue();
}
