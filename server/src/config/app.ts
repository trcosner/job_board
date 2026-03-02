import express, { json } from 'express';
import { NotFoundError } from '../errors/NotFoundError';
import { errorHandler } from '../middleware/errorHandler';
import { generalRateLimit } from '../middleware/rateLimit';
import authRouter from '../routes/auth';
import healthRouter from '../routes/health';
import metricsRouter from '../routes/metrics';
import jobsRouter from '../routes/jobs';
import analyticsRouter from '../routes/analytics';
import { Environment } from './environment';
import { metricsMiddleware } from '../middleware/metrics';
import { sanitizeInput } from '../middleware/validateRequest';

import { 
  securityHeaders, 
  corsHandler,
  requestTimeout,
  requestId,
  requestLogging,
  errorContext,
  performanceMonitoring
} from '../middleware';

export const createApp = (env: Environment): express.Application => {
  const app = express();

  // Trust proxy if in production (for load balancers, NGINX, etc.)
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Security middleware
  app.use(securityHeaders);
  app.use(corsHandler);

  // Reliability middleware
  app.use(requestTimeout(30000));
  app.use(requestId);

  // Parsing middleware
  app.use(json({ limit: '10mb' }));

  // Input sanitization (before validation)
  app.use(sanitizeInput);

  // Logging and observability middleware
  app.use(requestLogging);
  app.use(performanceMonitoring(1000)); // Log slow requests over 1s
  app.use(metricsMiddleware); // Prometheus metrics collection

  // General rate limiting (only if Redis is available)
  if (env.REDIS_URL) {
    app.use(generalRateLimit);
  }

  // Store config for access in routes (avoid 'env' - reserved by Express)
  app.locals.config = env;

  // Health check endpoints
  app.use('/health', healthRouter);

  // Prometheus metrics endpoint
  app.use('/metrics', metricsRouter);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Job Board API',
      version: '1.0.0',
      environment: env.NODE_ENV
    });
  });

  // API routes
  app.use('/auth', authRouter);
  app.use('/jobs', jobsRouter);
  app.use('/analytics', analyticsRouter);
  // app.use('/companies', companiesRouter);
  // app.use('/users', usersRouter);

  // Catch-all for 404s - Express 5 compatible
  app.use((req, res, next) => {
    next(new NotFoundError());
  });

  // Error context enrichment
  app.use(errorContext);

  // Error handler - MUST be last
  app.use(errorHandler);

  return app;
};