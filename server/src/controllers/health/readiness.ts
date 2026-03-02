import { Request, Response } from 'express';
import { checkHealth } from '../../database/health';

export const readinessController = async (req: Request, res: Response) => {
  try {
    const dbHealth = await checkHealth();

    if (dbHealth.healthy) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        database: {
          healthy: true,
          latency: dbHealth.latency,
        },
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reason: 'Database not healthy',
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      reason: 'Readiness check failed',
    });
  }
};
