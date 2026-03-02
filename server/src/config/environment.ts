import { z } from 'zod';
import logger from '../utils/logger';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().min(1).max(65535).default(3000),
  
  // Database
  DATABASE_URL: z.string().url('Invalid database URL'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // Optional Redis (for sessions/caching)
  REDIS_URL: z.string().url().optional(),
  
  // Optional CORS
  CORS_ORIGIN: z.string().default('*'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // Logging level
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type Environment = z.infer<typeof envSchema>;

export const validateEnvironment = (): Environment => {
  try {
    const env = envSchema.parse(process.env);
    
    logger.info('Environment variables validated successfully', {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      logLevel: env.LOG_LEVEL,
      hasRedis: !!env.REDIS_URL
    });
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Environment validation failed:', {
        errors: error.issues.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          received: err.code === 'invalid_type' ? (err as any).received : undefined
        }))
      });
      
      console.error('\n Environment Configuration Errors:');
      error.issues.forEach(err => {
        console.error(`  • ${err.path.join('.')}: ${err.message}`);
      });
      console.error('\nPlease check your .env file and environment variables.\n');
    } else {
      logger.error('Unexpected error during environment validation:', error);
    }
    
    process.exit(1);
  }
};

// Default environment values for development
export const getDefaultEnvExample = () => ({
  NODE_ENV: 'development',
  PORT: 3000,
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/job_board',
  JWT_SECRET: 'your-super-secret-jwt-key-at-least-32-characters-long',
  JWT_EXPIRES_IN: '24h',
  REDIS_URL: 'redis://localhost:6379', // optional
  CORS_ORIGIN: '*',
  RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  LOG_LEVEL: 'info'
});

/**
 * Load environment variables from .env file
 * Must be called before any other imports that depend on process.env
 */
export function loadEnvironment(): void {
  // Get current directory in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Load .env file with explicit path (works regardless of cwd)
  const envPath = resolve(__dirname, '../../.env');
  const result = config({ path: envPath });

  if (result.error) {
    console.error('Failed to load .env file from:', envPath);
    console.error('Error:', result.error);
    process.exit(1);
  }

  console.log('✓ Environment loaded from:', envPath);
  
  // Debug output in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Parsed variables:', Object.keys(result.parsed || {}).join(', '));
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Missing');
  }
}
