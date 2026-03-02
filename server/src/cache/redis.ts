import Redis, { RedisOptions } from 'ioredis';
import { Environment } from '../config/environment';
import logger from '../utils/logger';

let redis: Redis | null = null;

/**
 * Create Redis connection with proper configuration
 */
export const createRedisClient = (env: Environment): Redis => {
  if (redis) {
    return redis;
  }

  const options: RedisOptions = {
    // Parse Redis URL or use defaults
    ...(env.REDIS_URL ? { connectionString: env.REDIS_URL } : {
      host: 'localhost',
      port: 6379,
    }),
    
    // Connection settings
    connectTimeout: 10000,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    
    // Reconnection strategy
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis: Maximum retry attempts reached - disabling retries');
        return null;
      }
      const delay = Math.min(times * 50, 1000);
      logger.warn(`Redis: Retrying connection in ${delay}ms (attempt ${times})`);
      return delay;
    },
    
    // Key prefix for multi-tenant scenarios
    keyPrefix: env.NODE_ENV === 'test' ? 'test:' : 'job_board:',
  };

  redis = new Redis(options);

  // Event handlers
  redis.on('connect', () => {
    logger.info('Redis connection established');
  });

  redis.on('ready', () => {
    logger.info('Redis client ready for commands');
  });

  redis.on('error', (error) => {
    logger.error('Redis connection error:', {
      error: error.message,
      name: error.name
    });
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
  });

  redis.on('reconnecting', (time: number) => {
    logger.info(`Redis reconnecting in ${time}ms`);
  });

  // Graceful error handling for commands
  redis.on('node error', (error, node) => {
    logger.error('Redis node error:', {
      error: error.message,
      node: node.options.host
    });
  });

  return redis;
};

/**
 * Get the Redis client instance
 */
export const getRedisClient = (): Redis | null => {
  if (!redis) {
    return null; // Return null instead of throwing during service construction
  }
  return redis;
};

/**
 * Close Redis connection
 */
export const closeRedisClient = async (): Promise<void> => {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis connection closed');
  }
};

/**
 * Health check for Redis
 */
export const pingRedis = async (): Promise<{ healthy: boolean; latency?: number; error?: string }> => {
  try {
    if (!redis) {
      return { healthy: false, error: 'Redis client not initialized' };
    }

    const start = Date.now();
    const pong = await redis.ping();
    const latency = Date.now() - start;

    return {
      healthy: pong === 'PONG',
      latency
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};