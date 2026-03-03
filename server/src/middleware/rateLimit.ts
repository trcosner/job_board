import { Request, Response, NextFunction } from 'express';
import { rateLimiter } from '../cache';
import { RateLimitError } from '../errors/RateLimitError';
import logger from '../utils/logger';

/**
 * Simple key generators for rate limiting
 */
export const getKey = {
  byIP: (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
    return `ip:${ip}`;
  },

  byUser: (req: Request): string => {
    return req.user?.id ? `user:${req.user.id}` : getKey.byIP(req);
  },

  byEmail: (req: Request): string => {
    const email = req.body?.email || req.query?.email;
    return email ? `email:${email}` : getKey.byIP(req);
  }
};

/**
 * Create rate limit middleware
 * Usage: rateLimit({ max: 100, window: 15 * 60, getKey: getKey.byIP })
 */
export function rateLimit(options: {
  max: number;           // Max requests
  window: number;        // Window in seconds
  getKey?: (req: Request) => string;
  message?: string;
}) {
  const {
    max,
    window,
    getKey: keyFn = getKey.byIP,
    message = 'Too many requests, please try again later'
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = keyFn(req);
      const result = await rateLimiter.checkLimit(key, max, window);

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
      });

      if (!result.allowed) {
        logger.warn('Rate limit exceeded', {
          key,
          ip: req.ip,
          endpoint: `${req.method} ${req.path}`,
          limit: max,
          window
        });

        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        throw new RateLimitError(message, retryAfter, max, result.remaining);
      }

      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      
      logger.warn('Rate limiter error - allowing request:', { error });
      next(); // Fail open
    }
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */

// General API rate limiting: 100 requests per 15 minutes
export const generalRateLimit = rateLimit({
  max: 100,
  window: 15 * 60,
  getKey: getKey.byIP
});

// Auth endpoints: 5 attempts per 15 minutes per email
export const authRateLimit = rateLimit({
  max: 5,
  window: 15 * 60,
  getKey: getKey.byEmail,
  message: 'Too many authentication attempts, please try again later'
});

// Strict endpoints: 30 attempts per hour per IP (used for token refresh)
export const strictRateLimit = rateLimit({
  max: 30,
  window: 60 * 60,
  getKey: getKey.byIP,
  message: 'Too many requests, please try again later'
});
