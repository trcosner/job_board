import { getRedisClient } from './redis';
import { IRateLimiter, RateLimitResult } from '../types/cache';
import logger from '../utils/logger';
import { rateLimitHits } from '../config/metrics';

/**
 * Redis-based rate limiter using sliding window algorithm
 * Single Responsibility: Rate limiting functionality
 * Fails open - if Redis is unavailable, allows all requests
 */
export class RedisRateLimiter implements IRateLimiter {
  private getClient() {
    try {
      const client = getRedisClient();
      if (!client || client.status !== 'ready') {
        return null;
      }
      return client;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Redis client unavailable for rate limiting:', { error: errorMessage });
      return null;
    }
  }

  /**
   * Check rate limit using sliding window algorithm
   * Uses Redis sorted sets to track requests in time windows
   * Fails open if Redis is unavailable
   */
  async checkLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    try {
      const client = this.getClient();
      if (!client) {
        // Fail open - allow request if cache unavailable
        logger.info('Rate limiter unavailable - allowing request', { key });
        return {
          allowed: true,
          remaining: limit,
          resetTime: Date.now() + (windowSeconds * 1000)
        };
      }
      
      const now = Date.now();
      const windowStart = now - (windowSeconds * 1000);
      const rateLimitKey = `rate_limit:${key}`;
      
      // Use Redis pipeline for atomic operations
      const pipeline = client.pipeline();
      
      // Remove old entries outside the window
      pipeline.zremrangebyscore(rateLimitKey, 0, windowStart);
      
      // Count current requests in window
      pipeline.zcard(rateLimitKey);
      
      // Add current request
      pipeline.zadd(rateLimitKey, now, `${now}-${Math.random()}`);
      
      // Set expiration for cleanup
      pipeline.expire(rateLimitKey, windowSeconds + 1);
      
      const results = await pipeline.exec();
      
      if (!results) {
        throw new Error('Pipeline execution failed');
      }
      
      const currentCount = results[1][1] as number;
      const allowed = currentCount < limit;
      const remaining = Math.max(0, limit - currentCount - 1);
      const resetTime = now + (windowSeconds * 1000);
      
      // If limit exceeded, remove the request we just added
      if (!allowed) {
        await client.zpopmax(rateLimitKey);
      }
      
      const result: RateLimitResult = {
        allowed,
        remaining,
        resetTime
      };
      
      // Track rate limit metrics
      const keyType = key.startsWith('ip:') ? 'ip' : 
                      key.startsWith('user:') ? 'user' : 
                      key.startsWith('email:') ? 'email' : 'other';
      rateLimitHits.labels(keyType, allowed ? 'allowed' : 'blocked').inc();
      
      if (!allowed) {
        logger.warn('Rate limit exceeded', {
          key,
          limit,
          currentCount: currentCount + 1,
          windowSeconds
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Rate limit check failed - allowing request:', { key, limit, windowSeconds, error: errorMessage });
      // Track as allowed (fail open)
      rateLimitHits.labels('error', 'allowed').inc();
      // Fail open - allow request if rate limiter fails
      return {
        allowed: true,
        remaining: limit,
        resetTime: Date.now() + (windowSeconds * 1000)
      };
    }
  }

  /**
   * Reset rate limit for a specific key
   * Fails gracefully if Redis unavailable
   */
  async reset(key: string): Promise<void> {
    try {
      const client = this.getClient();
      if (!client) {
        return; // Fail gracefully
      }
      
      const rateLimitKey = `rate_limit:${key}`;
      await client.del(rateLimitKey);
      
      logger.info('Rate limit reset', { key });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Rate limit reset failed:', { key, error: errorMessage });
      // Don't throw error for reset operation
    }
  }

  /**
   * Get current rate limit status without incrementing
   * Fails gracefully if Redis unavailable
   */
  async getStatus(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    try {
      const client = this.getClient();
      if (!client) {
        // Return status indicating no rate limiting
        return {
          allowed: true,
          remaining: limit,
          resetTime: Date.now() + (windowSeconds * 1000)
        };
      }
      
      const now = Date.now();
      const windowStart = now - (windowSeconds * 1000);
      const rateLimitKey = `rate_limit:${key}`;
      
      // Clean up old entries and count current
      await client.zremrangebyscore(rateLimitKey, 0, windowStart);
      const currentCount = await client.zcard(rateLimitKey);
      
      const remaining = Math.max(0, limit - currentCount);
      const resetTime = now + (windowSeconds * 1000);
      
      return {
        allowed: currentCount < limit,
        remaining,
        resetTime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Rate limit status check failed:', { key, error: errorMessage });
      // Fail open
      return {
        allowed: true,
        remaining: limit,
        resetTime: Date.now() + (windowSeconds * 1000)
      };
    }
  }

  /**
   * Remove all rate limit data for cleanup
   */
  async clearAll(): Promise<void> {
    try {
      const client = this.getClient();
      if (!client) {
        return; // Fail gracefully
      }
      
      const keys = await client.keys('rate_limit:*');
      
      if (keys.length > 0) {
        await client.del(...keys);
        logger.info('All rate limits cleared', { count: keys.length });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Rate limit clear all failed:', { error: errorMessage });
      // Fail gracefully
    }
  }
}