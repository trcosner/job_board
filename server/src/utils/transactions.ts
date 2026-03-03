import { PoolClient } from 'pg';
import { getPool } from '../database/index.js';
import logger from './logger.js';

/**
 * Execute code within a database transaction
 * Ensures ACID compliance for multi-step operations
 * 
 * @param callback - Async function to execute within transaction
 * @returns Result of the callback
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  
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
