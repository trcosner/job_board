// Load environment variables first (before any other imports)
import { Server } from 'http';
import { loadEnvironment } from './config/environment.js';

loadEnvironment();

// Now import everything else AFTER env is loaded
const { validateEnvironment } = await import('./config/environment.js');
const { createApp } = await import('./config/app.js');
const { initializeDatabase } = await import('./utils/initDatabase.js');
const { initializeRedis } = await import('./utils/initRedis.js');
const { setupGracefulShutdown } = await import('./utils/shutdown.js');
const { setupGlobalErrorHandlers } = await import('./utils/errorHandlers.js');
const loggerModule = await import('./utils/logger.js');
const logger = loggerModule.default;

// Setup global error handlers
setupGlobalErrorHandlers();

// Initialize event listeners
await import('./events/listeners/index.js');

const start = async (): Promise<void> => {
  try {
    // Validate environment variables first
    const env = validateEnvironment();
    
    // Initialize database
    await initializeDatabase(env);
    
    // Initialize Redis (optional)
    const redisClient = await initializeRedis(env);
    
    // Create Express app with validated config
    const app = createApp(env);
    
    // Start server
    const server: Server = app.listen(env.PORT, () => {
      logger.info(`Job Board API started successfully`, {
        port: env.PORT,
        environment: env.NODE_ENV,
        nodeVersion: process.version,
        processId: process.pid
      });
    });

    // Setup graceful shutdown
    setupGracefulShutdown(server, redisClient);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
start();