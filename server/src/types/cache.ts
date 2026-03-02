/**
 * Cache types and interfaces
 * Simplified for practical use
 */

export interface ICacheReader {
  get<T>(key: string): Promise<T | null>;
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  exists(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
}

export interface ICacheWriter {
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean>;
  setex<T>(key: string, ttlSeconds: number, value: T): Promise<boolean>;
  mset<T>(keyValuePairs: Record<string, T>, ttlSeconds?: number): Promise<boolean>;
  del(key: string | string[]): Promise<number>;
}

export interface ICacheManager extends ICacheReader, ICacheWriter {
  invalidatePattern(pattern: string): Promise<number>;
  clear(): Promise<void>;
  ping(): Promise<boolean>;
}

/**
 * Rate limiting interface
 */
export interface IRateLimiter {
  checkLimit(key: string, limit: number, window: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }>;
  reset(key: string): Promise<void>;
}

/**
 * Rate limiting configuration types
 */
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
  skip?: (req: any) => boolean;
  onLimitReached?: (req: any, res: any) => void;
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetTime: number;
};