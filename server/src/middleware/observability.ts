import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Business event tracking and performance monitoring middleware
 * 
 * Single Responsibility: Track business actions and detect performance issues
 * 
 * Related files:
 * - ./metrics.ts - Prometheus metrics collection (request/response metrics)
 * - ../config/metrics.ts - Metric definitions (what to measure)
 * 
 * Use cases:
 * - Track specific business actions (user_login, job_application, etc.)
 * - Detect slow requests and performance bottlenecks
 * - Log business-critical events for analytics
 */

/**
 * OPTIONAL: Business event tracking
 * Single Responsibility: Track specific business actions
 * Use sparingly - only for critical business metrics
 */
export const trackUserAction = (action: string, getMetadata?: (req: Request) => any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalSend = res.send;
    res.send = function(data: any) {
      // Only track on success
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const metadata = getMetadata ? getMetadata(req) : {};
        
        logger.info('User action tracked', {
          action,
          requestId: req.requestId,
          userId: req.user?.id,
          metadata,
          timestamp: new Date().toISOString()
        });

        // TODO: Send to analytics service asynchronously
        // analyticsQueue.add('user_action', { action, userId: req.user?.id, metadata });
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * OPTIONAL: Performance monitoring for slow requests
 * Single Responsibility: Detect performance issues
 */
export const performanceMonitoring = (slowThresholdMs: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = process.hrtime.bigint();
    
    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      
      if (durationMs > slowThresholdMs) {
        logger.warn('Slow request detected', {
          requestId: req.requestId,
          method: req.method,
          url: req.originalUrl,
          duration: Math.round(durationMs),
          statusCode: res.statusCode,
          userId: req.user?.id
        });
      }
    });

    next();
  };
};