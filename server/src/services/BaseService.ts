import { Pool } from 'pg';
import { getPool } from '../database/connection.js';
import logger from '../utils/logger.js';

/**
 * Base service class providing common functionality
 * All services should extend this class
 */
export abstract class BaseService {
  protected get pool(): Pool {
    return getPool();
  }

  constructor() {
    // Pool is lazy-loaded via getter to avoid initialization order issues
  }

  /**
   * Execute code within a database transaction
   * Ensures ACID compliance for multi-step operations
   * 
   * @param callback - Async function to execute within transaction
   * @returns Result of the callback
   */
  protected async withTransaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Log service-level errors with context
   */
  protected logError(context: string, error: any, metadata?: Record<string, any>): void {
    logger.error(`Service error in ${context}:`, {
      error: error.message || error,
      stack: error.stack,
      ...metadata,
    });
  }

  /**
   * Log service-level info with context
   */
  protected logInfo(context: string, message: string, metadata?: Record<string, any>): void {
    logger.info(`[${context}] ${message}`, metadata);
  }

  /**
   * Log service-level debug with context
   */
  protected logDebug(context: string, message: string, metadata?: Record<string, any>): void {
    logger.debug(`[${context}] ${message}`, metadata);
  }
}
