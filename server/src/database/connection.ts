import { Pool, PoolConfig, QueryConfig, QueryResult, QueryResultRow } from 'pg';
import { Environment } from '../config/environment';
import logger from '../utils/logger';
import { databaseConnections, databaseQueryDuration, activeUserSessions } from '../config/metrics';

let pool: Pool | null = null;

/**
 * Create PostgreSQL connection pool
 * Simple setup - learn pg directly!
 */
export const createPool = (env: Environment): Pool => {
  if (pool) {
    return pool;
  }

  const config: PoolConfig = {
    connectionString: env.DATABASE_URL,
    
    // Basic pool settings
    min: env.NODE_ENV === 'production' ? 5 : 2,
    max: env.NODE_ENV === 'production' ? 20 : 10,
    
    // Timeouts
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    
    // SSL for production
    ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };

  pool = new Pool(config);

  // Handle pool errors
  pool.on('error', (err) => {
    logger.error('PostgreSQL pool error:', err);
  });
  
  // Track connection metrics - force initial update
  const updateConnectionMetric = () => {
    if (pool) {
      // pg Pool exposes totalCount, idleCount, waitingCount
      const total = pool.totalCount;
      const idle = pool.idleCount;
      const waiting = pool.waitingCount;
      
      logger.debug('Pool stats', { total, idle, waiting });
      
      // Set metric to total connections in pool
      databaseConnections.set(total);
    }
  };
  
  pool.on('connect', () => {
    if (env.NODE_ENV === 'development') {
      logger.debug('New PostgreSQL client connected to pool');
    }
    updateConnectionMetric();
  });
  
  pool.on('remove', () => {
    updateConnectionMetric();
  });

  // Update metrics periodically (every 10 seconds)
  setInterval(updateConnectionMetric, 10000);
  
  // Initial update
  updateConnectionMetric();

  logger.info('PostgreSQL pool created', {
    min: config.min,
    max: config.max,
    environment: env.NODE_ENV
  });

  return pool;
};

/**
 * Get the pool instance
 */
export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call createPool() first.');
  }
  return pool;
};

/**
 * Close the pool
 */
export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
};

/**
 * Query wrapper with metric tracking
 * Automatically tracks duration of all database queries
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const currentPool = getPool();
  const startTime = Date.now();
  
  // Extract operation and table from query
  const operation = text.trim().split(/\s+/)[0].toUpperCase();
  const tableMatch = text.match(/(?:FROM|INTO|UPDATE|TABLE)\s+([\w.]+)/i);
  const table = tableMatch ? tableMatch[1] : 'unknown';
  
  try {
    const result = await currentPool.query<T>(text, params);
    const duration = (Date.now() - startTime) / 1000;
    
    // Track query duration
    databaseQueryDuration
      .labels(operation, table)
      .observe(duration);
    
    return result;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    
    // Track failed query duration
    databaseQueryDuration
      .labels(`${operation}_ERROR`, table)
      .observe(duration);
    
    throw error;
  }
}

/**
 * Update active user sessions metric
 * Counts unique users with non-revoked, non-expired refresh tokens
 */
async function updateActiveSessionsMetric(): Promise<void> {
  try {
    if (!pool) {
      logger.warn('Pool not initialized, skipping active sessions metric update');
      return;
    }
    
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(DISTINCT user_id) as count 
       FROM refresh_tokens 
       WHERE revoked_at IS NULL 
       AND expires_at > NOW()`
    );
    
    const count = parseInt(result.rows[0]?.count || '0', 10);
    activeUserSessions.set(count);
    logger.debug('Active sessions metric updated', { count });
  } catch (error) {
    logger.error('Failed to update active sessions metric:', error);
  }
}

/**
 * Start periodic active sessions tracking
 * Updates every 30 seconds
 */
export function startSessionTracking(): void {
  // Update immediately on start
  updateActiveSessionsMetric();
  
  // Then update every 30 seconds
  setInterval(() => {
    updateActiveSessionsMetric();
  }, 30000);
  
  logger.info('Active sessions tracking started');
}

// Export the pool directly for repositories to use
export { pool };