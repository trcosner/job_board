/**
 * Client-side analytics types
 * Subset of server types - only what the client needs to send
 */

/**
 * Analytics event names
 * Keep in sync with server/src/types/analytics.ts
 */
export enum AnalyticsEventName {
  // Page tracking
  PAGE_VIEW = 'page_view',
  
  // Authentication events
  USER_LOGIN_STARTED = 'user_login_started',
  USER_LOGIN_COMPLETED = 'user_login_completed',
  USER_LOGIN_FAILED = 'user_login_failed',
  
  USER_REGISTER_STARTED = 'user_register_started',
  USER_REGISTER_COMPLETED = 'user_register_completed',
  USER_REGISTER_FAILED = 'user_register_failed',
  
  USER_LOGOUT = 'user_logout',
  
  // Job events
  JOB_VIEW = 'job_view',
  JOB_SEARCH = 'job_search',
  JOB_APPLY_STARTED = 'job_apply_started',
  JOB_APPLY_COMPLETED = 'job_apply_completed',
  
  // Employer events
  JOB_POST_STARTED = 'job_post_started',
  JOB_POST_COMPLETED = 'job_post_completed',
  
  // Engagement events
  BUTTON_CLICK = 'button_click',
  FORM_SUBMIT = 'form_submit',
  LINK_CLICK = 'link_click',
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
