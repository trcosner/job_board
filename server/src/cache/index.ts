/**
 * Cache module exports
 * Simplified cache interface
 */

// Redis client
export { createRedisClient, getRedisClient, closeRedisClient, pingRedis } from './redis';

// Service instances (singletons)
import { RedisCacheService } from './CacheService';
import { RedisRateLimiter } from './RateLimiterService';

export const cacheService = new RedisCacheService();
export const rateLimiter = new RedisRateLimiter();

// Types (re-export for convenience)
export type {
  ICacheReader,
  ICacheWriter, 
  ICacheManager,
  IRateLimiter,
  RateLimitConfig,
  RateLimitResult
} from '../types/cache';

// Errors
export { RateLimitError } from '../errors/RateLimitError';