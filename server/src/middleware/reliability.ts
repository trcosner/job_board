import { Request, Response, NextFunction } from 'express';
import { TimeoutError } from '../errors/TimeoutError';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * ESSENTIAL: Request timeout protection
 * Single Responsibility: Prevent hanging requests
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        const error = new TimeoutError(
          `Request timeout after ${timeoutMs}ms`,
          `${req.method} ${req.originalUrl}`,
          timeoutMs
        );
        next(error);
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};

/**
 * ESSENTIAL: Request ID for debugging
 * Single Responsibility: Add unique ID to each request
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = req.headers['x-request-id'] as string || 
                  `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  
  res.setHeader('x-request-id', req.requestId);
  next();
};