import { Request, Response } from 'express';
import { getUserApplicationStats } from '../../services/ApplicationService/index.js';

/**
 * Get application statistics for the current user
 * GET /api/applications/stats
 */
export const getMyApplicationStatsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const stats = await getUserApplicationStats(userId);

  res.status(200).json({ stats });
};
