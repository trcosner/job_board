import { Environment } from '../config/environment';
import { createRedisClient, pingRedis } from '../cache';
import logger from './logger';

/**
 * Initialize Redis cache connection
 * Fails gracefully if Redis is unavailable
 * Returns Redis client or null
 */
export async function initializeRedis(env: Environment): Promise<any | null> {
  if (!env.REDIS_URL) {
    logger.warn('Redis URL not provided - caching features disabled');
    return null;
  }

  try {
    logger.info('Connecting to Redis...');
    const redisClient = createRedisClient(env);
    await redisClient.connect();
    
    // Verify connection with ping
    const pingResult = await pingRedis();
    if (pingResult.healthy) {
      logger.info('Redis connected successfully', { latency: pingResult.latency });
      return redisClient;
    } else {
      throw new Error(pingResult.error || 'Redis ping failed');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Redis connection failed - continuing without cache:', { error: errorMessage });
    return null;
  }
}
