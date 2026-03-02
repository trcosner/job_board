import express from 'express';
import { healthController, livenessController, readinessController } from '../controllers/health';

const healthRouter = express.Router();

/**
 * Overall health check endpoint
 * Checks database, Redis (if configured), and basic app status
 * Used by load balancers and monitoring systems
 */
healthRouter.get('/', healthController);

/**
 * Liveness probe endpoint
 * Returns 200 if the application process is running
 * Used by Kubernetes/container orchestrators to know if app should be restarted
 */
healthRouter.get('/liveness', livenessController);

/**
 * Readiness probe endpoint
 * Returns 200 if the application is ready to receive traffic
 * Checks critical dependencies (database connection)
 * Used by Kubernetes/load balancers to know if app should receive requests
 */
healthRouter.get('/readiness', readinessController);

export default healthRouter;
