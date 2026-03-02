import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal } from '../config/metrics';

declare global {
  namespace Express {
    interface Request {
      metricsStart?: number;
    }
  }
}

/**
 * Prometheus metrics collection middleware
 * Single Responsibility: Collect HTTP request metrics
 * 
 * Automatically tracks:
 * - Request duration (histogram)
 * - Request count (counter)
 * - By method, route, and status code
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.metricsStart = Date.now();
  
  // Hook into response finish to record metrics
  res.on('finish', () => {
    const duration = (Date.now() - (req.metricsStart || 0)) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode.toString();
    
    // Record duration histogram
    httpRequestDuration
      .labels(method, route, statusCode)
      .observe(duration);
    
    // Increment request counter
    httpRequestTotal
      .labels(method, route, statusCode)
      .inc();
  });

  next();
};
