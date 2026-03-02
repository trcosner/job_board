import logger from './logger';

/**
 * Setup global error handlers for unhandled errors
 * Logs errors and exits process
 */
export function setupGlobalErrorHandlers(): void {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at Promise:', { reason, promise });
    process.exit(1);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}
