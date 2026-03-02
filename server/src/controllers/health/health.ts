import { Request, Response } from 'express';
import { checkHealth } from '../../database/health';
import { getRedisClient } from '../../cache';
import { Environment } from '../../config/environment';

export const healthController = async (req: Request, res: Response) => {
  try {
    const env = req.app.locals.config as Environment;
    const dbHealth = await checkHealth();

    // Check Redis health if enabled
    let redisHealth: {
      healthy: boolean;
      latency: number | null;
      connected: boolean;
    } = {
      healthy: false,
      latency: null,
      connected: false,
    };

    if (env.REDIS_URL) {
      try {
        const redisClient = getRedisClient();
        if (redisClient) {
          const start = Date.now();
          const pong = await redisClient.ping();
          const latency = Date.now() - start;
          redisHealth = {
            healthy: pong === 'PONG',
            latency,
            connected: redisClient.status === 'ready',
          };
        }
      } catch (error) {
        redisHealth = { healthy: false, latency: null, connected: false };
      }
    } else {
      redisHealth = { healthy: true, latency: null, connected: false }; // Not required
    }

    const overallHealthy =
      dbHealth.healthy && (redisHealth.healthy || !env.REDIS_URL);

    const health = {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      database: {
        healthy: dbHealth.healthy,
        latency: dbHealth.latency,
        version: dbHealth.version?.split(' ')[0] || 'unknown',
      },
      cache: env.REDIS_URL
        ? {
            healthy: redisHealth.healthy,
            latency: redisHealth.latency,
            connected: redisHealth.connected,
          }
        : {
            enabled: false,
            message: 'Redis not configured',
          },
    };

    const statusCode = overallHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
};
