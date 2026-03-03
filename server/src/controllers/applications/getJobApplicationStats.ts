import { Request, Response } from 'express';
import { getJobApplicationStats } from '../../services/ApplicationService/index.js';

/**
 * Get application statistics for a job
 * GET /api/jobs/:id/applications/stats
 */
export const getJobApplicationStatsController = async (req: Request, res: Response) => {
  const jobId = req.params.id as string;

  const stats = await getJobApplicationStats(jobId);

  res.status(200).json({ stats });
};
