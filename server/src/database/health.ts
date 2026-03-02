import { getPool } from './connection';
import logger from '../utils/logger';

/**
 * Simple database health check
 * Learn to work with pg result objects directly!
 */
export const checkHealth = async () => {
  try {
    const pool = getPool();
    const start = Date.now();
    
    // Simple test query - see raw pg result structure
    const result = await pool.query('SELECT NOW() as timestamp, version() as version');
    const latency = Date.now() - start;
    
    const row = result.rows[0]; // Learn to access result.rows
    
    logger.info('Database health check passed', {
      latency: `${latency}ms`,
      timestamp: row.timestamp,
      version: row.version.split(' ')[0] // Just PostgreSQL version number
    });
    
    return {
      healthy: true,
      latency,
      timestamp: row.timestamp,
      version: row.version
    };
    
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Test if we can connect and run basic queries
 */
export const testConnection = async (): Promise<void> => {
  logger.info('Testing database connection...');
  
  try {
    const pool = getPool();
    
    // Test basic connection - learn pg.Pool methods
    const client = await pool.connect();
    
    try {
      // Test query - see the raw pg response
      const result = await client.query(`
        SELECT 
          current_database() as database,
          current_user as user,
          version() as version
      `);
      
      // Access result.rows directly - learn pg patterns
      const info = result.rows[0];
      
      logger.info('Database connection successful', {
        database: info.database,
        user: info.user,
        version: info.version.substring(0, 50) + '...' // Truncate long version string
      });
      
      // Check if our migrations table exists
      const migrationCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'pgmigrations'
        )
      `);
      
      const migrationsExist = migrationCheck.rows[0].exists;
      
      if (migrationsExist) {
        // Get migration count
        const countResult = await client.query('SELECT COUNT(*) FROM pgmigrations');
        const migrationCount = countResult.rows[0].count;
        logger.info(`Found ${migrationCount} migration(s) in database`);
      } else {
        logger.warn('⚠️  No pgmigrations table found. Run migrations with: npm run migrate:up');
      }
      
    } finally {
      // Always release client back to pool
      client.release();
    }
    
  } catch (error) {
    logger.error('Database connection test failed:', error);
    throw error;
  }
};

/**
 * Quick connectivity test - just ping the database
 */
export const ping = async (): Promise<boolean> => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1'); // Simplest possible query
    return true;
  } catch (error) {
    return false;
  }
};