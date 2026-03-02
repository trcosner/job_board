import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../cache';
import logger from '../utils/logger';
import '../types/express';

/**
 * Simple cache configuration
 */
export const CACHE_TTL = {
  SHORT: 300,     // 5 minutes - search results, volatile data
  MEDIUM: 1800,   // 30 minutes - job listings
  LONG: 3600,     // 1 hour - user profiles
  EXTRA_LONG: 7200 // 2 hours - company profiles, rarely changing data
} as const;

/**
 * Generate cache key for entity
 */
export function cacheKey(entity: string, id: string, suffix?: string): string {
  return suffix ? `${entity}:${id}:${suffix}` : `${entity}:${id}`;
}

/**
 * Simple cache middleware
 * Use: cache({ key: 'user', getId: (req) => req.params.id, ttl: CACHE_TTL.LONG })
 */
export function cache(options: {
  key: string;
  getId: (req: Request) => string;
  ttl?: number;
}) {
  const ttl = options.ttl || CACHE_TTL.MEDIUM;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = options.getId(req);
      const key = cacheKey(options.key, id);
      
      // Try cache
      const cached = await cacheService.get(key);
      if (cached !== null) {
        logger.debug('Cache hit', { key });
        res.json(cached);
        return;
      }
      
      // Intercept response to cache it
      const originalJson = res.json;
      res.json = function(data: any) {
        cacheService.set(key, data, ttl).catch(() => {
          logger.debug('Failed to cache response', { key });
        });
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.warn('Cache middleware error', { error });
      next();
    }
  };
}

/**
 * Invalidate cache on successful mutations
 * Use: invalidateCache({ getKeys: (req) => [`user:${req.params.id}`] })
 */
export function invalidateCache(options: {
  getKeys: (req: Request) => string[];
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.send;
    res.send = function(data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const keys = options.getKeys(req);
        cacheService.del(keys).catch(() => {
          logger.debug('Cache invalidation failed', { keys });
        });
      }
      return originalSend.call(this, data);
    };
    next();
  };
}