import { getRedisClient } from './redis';
import { ICacheManager } from '../types/cache';
import logger from '../utils/logger';
import { cacheOperations, cacheOperationDuration } from '../config/metrics';

/**
 * Redis-based cache service implementing ICacheManager
 * Single Responsibility: Manages Redis cache operations
 * Fails gracefully - cache unavailability doesn't break the app
 */
export class RedisCacheService implements ICacheManager {
  private getClient() {
    try {
      const client = getRedisClient();
      if (!client || client.status !== 'ready') {
        return null;
      }
      return client;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Redis client unavailable:', { error: errorMessage });
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    try {
      const client = this.getClient();
      if (!client) {
        cacheOperations.labels('get', 'error').inc();
        return null; // Fail gracefully
      }
      
      const value = await client.get(key);
      
      const duration = (Date.now() - startTime) / 1000;
      cacheOperationDuration.labels('get').observe(duration);
      
      if (value === null) {
        cacheOperations.labels('get', 'miss').inc();
        return null;
      }
      
      cacheOperations.labels('get', 'hit').inc();
      return JSON.parse(value) as T;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Cache get failed - continuing without cache:', { key, error: errorMessage });
      cacheOperations.labels('get', 'error').inc();
      return null; // Fail gracefully
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const startTime = Date.now();
    try {
      const client = this.getClient();
      if (!client) {
        cacheOperations.labels('set', 'error').inc();
        return false; // Fail gracefully
      }
      
      const serialized = JSON.stringify(value);
      
      let result: string | null;
      if (ttlSeconds) {
        result = await client.setex(key, ttlSeconds, serialized);
      } else {
        result = await client.set(key, serialized);
      }
      
      const duration = (Date.now() - startTime) / 1000;
      cacheOperationDuration.labels('set').observe(duration);
      
      const success = result === 'OK';
      cacheOperations.labels('set', success ? 'success' : 'error').inc();
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Cache set failed - continuing without caching:', { key, ttlSeconds, error: errorMessage });
      cacheOperations.labels('set', 'error').inc();
      return false; // Fail gracefully
    }
  }

  async setex<T>(key: string, ttlSeconds: number, value: T): Promise<boolean> {
    return this.set(key, value, ttlSeconds);
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const client = this.getClient();
      if (!client) {
        return keys.map(() => null); // Fail gracefully
      }
      
      const values = await client.mget(keys);
      
      return values.map(value => {
        if (value === null) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Cache mget failed - continuing without cache:', { keys, error: errorMessage });
      return keys.map(() => null); // Fail gracefully
    }
  }

  async mset<T>(keyValuePairs: Record<string, T>, ttlSeconds?: number): Promise<boolean> {
    try {
      const client = this.getClient();
      if (!client) {
        return false; // Fail gracefully
      }
      
      const pipeline = client.pipeline();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
          pipeline.setex(key, ttlSeconds, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      });
      
      const results = await pipeline.exec();
      return results?.every(result => result[1] === 'OK') ?? false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Cache mset failed - continuing without caching:', { keys: Object.keys(keyValuePairs), ttlSeconds, error: errorMessage });
      return false; // Fail gracefully
    }
  }

  async del(key: string | string[]): Promise<number> {
    const startTime = Date.now();
    try {
      const client = this.getClient();
      if (!client) {
        cacheOperations.labels('del', 'error').inc();
        return 0; // Fail gracefully
      }
      
      const keys = Array.isArray(key) ? key : [key];
      const count = await client.del(...keys);
      
      const duration = (Date.now() - startTime) / 1000;
      cacheOperationDuration.labels('del').observe(duration);
      cacheOperations.labels('del', count > 0 ? 'success' : 'miss').inc();
      
      return count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Cache del failed - continuing without deletion:', { key, error: errorMessage });
      cacheOperations.labels('del', 'error').inc();
      return 0; // Fail gracefully
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = this.getClient();
      if (!client) {
        return false; // Fail gracefully
      }
      
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Cache exists check failed:', { key, error: errorMessage });
      return false; // Fail gracefully
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const client = this.getClient();
      if (!client) {
        return -1; // Fail gracefully
      }
      
      return await client.ttl(key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Cache ttl check failed:', { key, error: errorMessage });
      return -1; // Fail gracefully
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const client = this.getClient();
      if (!client) {
        return 0; // Fail gracefully
      }
      
      const keys = await client.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }
      
      return await client.del(...keys);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Cache pattern invalidation failed:', { pattern, error: errorMessage });
      return 0; // Fail gracefully
    }
  }

  async clear(): Promise<void> {
    try {
      const client = this.getClient();
      if (!client) {
        return; // Fail gracefully
      }
      
      const keyPrefix = client.options.keyPrefix || '';
      
      if (keyPrefix) {
        // Only clear keys with our prefix
        await this.invalidatePattern(`${keyPrefix}*`);
      } else {
        // Fallback: clear entire database (dangerous!)
        await client.flushdb();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Cache clear failed:', { error: errorMessage });
      // Fail gracefully - don't throw
    }
  }

  async ping(): Promise<boolean> {
    try {
      const client = this.getClient();
      if (!client) {
        return false;
      }
      
      const result = await client.ping();
      return result === 'PONG';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Cache ping failed:', { error: errorMessage });
      return false;
    }
  }
}