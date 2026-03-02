import express from 'express';
import { metricsController } from '../controllers/metrics';

const metricsRouter = express.Router();

/**
 * Prometheus metrics endpoint
 * Exposes application metrics for Prometheus scraping
 * Should be protected in production (firewall or authentication)
 */
metricsRouter.get('/', metricsController);

export default metricsRouter;
