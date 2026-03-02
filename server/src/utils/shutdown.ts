import { Server } from 'http';
import { closePool } from '../database';
import { closeRedisClient } from '../cache';
import logger from './logger';

/**
 * Graceful shutdown handler
 * Closes all connections and exits cleanly
 */
export function setupGracefulShutdown(server: Server, redisClient: any): void {
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);
    
    server.close(async (err) => {
      if (err) {
        logger.error('Error during server shutdown:', err);
        process.exit(1);
      }
      
      logger.info('Server closed successfully');
      
      // Close database pool
      try {
        await closePool();
        logger.info('Database connections closed');
      } catch (error) {
        logger.error('Error closing database:', error);
      }
      
      // Close Redis connection
      if (redisClient) {
        try {
          await closeRedisClient();
          logger.info('Redis connection closed');
        } catch (error) {
          logger.error('Error closing Redis:', error);
        }
      }
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    });
    
    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };
      
  // Listen for shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
