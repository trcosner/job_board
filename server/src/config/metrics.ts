import { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

/**
 * Prometheus metrics registry and custom metrics
 * Staff-level production monitoring setup
 * 
 * Single Responsibility: Define what metrics to collect
 * This file contains only metric definitions (configuration)
 */

// Create separate registry to avoid conflicts
export const register = new Registry();

// Collect default Node.js metrics (memory, GC, etc.)
collectDefaultMetrics({ register });

// HTTP Request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Business metrics
export const authenticationAttempts = new Counter({
  name: 'authentication_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['type', 'status'] // type: login/register, status: success/failure
});

export const jobApplications = new Counter({
  name: 'job_applications_total',
  help: 'Total job applications submitted',
  labelNames: ['status'] // status: success/failure
});

export const activeUserSessions = new Gauge({
  name: 'active_user_sessions',
  help: 'Number of active user sessions'
});

// Database metrics
export const databaseConnections = new Gauge({
  name: 'database_connections_active',
  help: 'Active database connections'
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Cache metrics
export const cacheOperations = new Counter({
  name: 'cache_operations_total',
  help: 'Total cache operations',
  labelNames: ['operation', 'status'] // operation: get/set/del, status: hit/miss/error
});

export const cacheOperationDuration = new Histogram({
  name: 'cache_operation_duration_seconds',
  help: 'Duration of cache operations in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.2]
});

// Rate limiting metrics
export const rateLimitHits = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total rate limit hits',
  labelNames: ['type', 'action'] // type: user/ip/global, action: allowed/blocked
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(authenticationAttempts);
register.registerMetric(jobApplications);
register.registerMetric(activeUserSessions);
register.registerMetric(databaseConnections);
register.registerMetric(databaseQueryDuration);
register.registerMetric(cacheOperations);
register.registerMetric(cacheOperationDuration);
register.registerMetric(rateLimitHits);
