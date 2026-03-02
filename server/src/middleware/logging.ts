import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface RequestLogData {
  requestId: string;
  method: string;
  url: string;
  statusCode?: number;
  duration?: number;
  userId?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * ESSENTIAL: Request logging for production debugging
 * Single Responsibility: Log requests with structured data
 * Open/Closed: Extensible via log data transformation
 */
export const requestLogging = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Hook into response to log completion
  const originalSend = res.send;
  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    
    const logData: RequestLogData = {
      requestId: req.requestId || 'unknown',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };

    // Log at appropriate level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', logData);
    } else {
      logger.info('Request completed', logData);
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * OPTIONAL: Error context enrichment
 * Single Responsibility: Add request context to errors
 */
export const errorContext = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  // Enrich error with request context
  logger.error('Request error occurred', {
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    request: {
      id: req.requestId,
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id,
      ip: req.ip
    }
  });

  next(err);
};