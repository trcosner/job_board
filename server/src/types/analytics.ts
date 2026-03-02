/**
 * Analytics Event Types
 * Shared types between client and server for type safety
 */

/**
 * Standard analytics event properties
 */
export interface BaseAnalyticsEvent {
  eventName: string;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  userType?: 'job_seeker' | 'employer';
  properties?: Record<string, any>;
}

/**
 * Client analytics event (what client sends)
 */
export interface ClientAnalyticsEvent {
  eventName: string;
  sessionId?: string;
  properties?: Record<string, any>;
}

/**
 * Enriched analytics event (after server processing)
 */
export interface EnrichedAnalyticsEvent extends BaseAnalyticsEvent {
  userId?: string;
  userType?: 'job_seeker' | 'employer';
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  url?: string;
  correlationId?: string;
}

/**
 * Batch analytics request
 */
export interface AnalyticsBatchRequest {
  events: ClientAnalyticsEvent[];
  sessionId?: string;
}

/**
 * Analytics event names - standardized across app
 */
export enum AnalyticsEventName {
  // Page views
  PAGE_VIEW = 'page_view',
  
  // Auth events
  USER_REGISTER_STARTED = 'user_register_started',
  USER_REGISTER_COMPLETED = 'user_register_completed',
  USER_REGISTER_FAILED = 'user_register_failed',
  USER_LOGIN_STARTED = 'user_login_started',
  USER_LOGIN_COMPLETED = 'user_login_completed',
  USER_LOGIN_FAILED = 'user_login_failed',
  USER_LOGOUT = 'user_logout',
  
  // Job events
  JOB_VIEW = 'job_view',
  JOB_SEARCH = 'job_search',
  JOB_APPLY_STARTED = 'job_apply_started',
  JOB_APPLY_COMPLETED = 'job_apply_completed',
  
  // UI interactions
  BUTTON_CLICK = 'button_click',
  LINK_CLICK = 'link_click',
  FORM_SUBMIT = 'form_submit',
  
  // Performance
  PERFORMANCE_METRIC = 'performance_metric',
  ERROR = 'error',
}

/**
 * Web Vitals metric names
 */
export enum WebVitalsMetric {
  CLS = 'CLS', // Cumulative Layout Shift
  FID = 'FID', // First Input Delay
  FCP = 'FCP', // First Contentful Paint
  LCP = 'LCP', // Largest Contentful Paint
  TTFB = 'TTFB', // Time to First Byte
  INP = 'INP', // Interaction to Next Paint
}

/**
 * Performance metric data
 */
export interface PerformanceMetricData {
  metric: WebVitalsMetric;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: string;
}
