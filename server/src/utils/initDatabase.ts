import { Environment } from '../config/environment';
import { createPool, testConnection, startSessionTracking } from '../database';
import logger from './logger';

/**
 * Initialize PostgreSQL database connection
 * Throws error if connection fails
 */
export async function initializeDatabase(env: Environment): Promise<void> {
  logger.info('Connecting to PostgreSQL...');
  createPool(env);
  await testConnection();
  logger.info('Database connected successfully');
  
  // Start tracking active sessions metric
  startSessionTracking();
}
