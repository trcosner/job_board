/**
 * Analytics Routes
 * Endpoints for receiving client-side analytics events
 */

import { Router } from 'express';
import { trackEvent, trackBatchEvents, trackPerformance, trackError } from '../controllers/analytics/index.js';
import { optionalAuth } from '../middleware/auth.js';
import { rateLimit, getKey } from '../middleware/rateLimit.js';
import { Environment } from '../config/environment.js';

const router = Router();

// Get environment config from app locals
const getEnv = (req: any): Environment => req.app.locals.config;

/**
 * POST /analytics/event
 * Track a single analytics event
 * 
 * Public endpoint (no auth required) but rate limited
 * User info is added if authenticated
 */
router.post(
  '/event',
  rateLimit({ max: 300, window: 60, getKey: getKey.byIP }), // 5 events/sec - reasonable for dev
  (req, res, next) => optionalAuth(getEnv(req))(req, res, next),
  trackEvent
);

/**
 * POST /analytics/batch
 * Track multiple analytics events in a single request
 * 
 * More efficient for client - batch events every few seconds
 * Public endpoint but rate limited
 */
router.post(
  '/batch',
  rateLimit({ max: 60, window: 60, getKey: getKey.byIP }), // 1 batch/sec
  (req, res, next) => optionalAuth(getEnv(req))(req, res, next),
  trackBatchEvents
);

/**
 * POST /analytics/performance
 * Track Web Vitals and performance metrics
 * 
 * Public endpoint - higher limit for multiple metrics per page
 */
router.post(
  '/performance',
  rateLimit({ max: 200, window: 60, getKey: getKey.byIP }), // ~3 metrics/sec
  (req, res, next) => optionalAuth(getEnv(req))(req, res, next),
  trackPerformance
);

/**
 * POST /analytics/error
 * Track client-side errors
 * 
 * Public endpoint for error reporting
 */
router.post(
  '/error',
  rateLimit({ max: 50, window: 60, getKey: getKey.byIP }), // ~1 error/sec
  (req, res, next) => optionalAuth(getEnv(req))(req, res, next),
  trackError
);

export default router;
