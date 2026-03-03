import { Request, Response } from 'express';
import { getJobsByOwner } from '../../services/JobService/index.js';

/**
 * Get jobs by current user's company (employer dashboard)
 * GET /api/jobs/my-jobs
 */
export const getMyJobsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string | undefined;

  const results = await getJobsByOwner(userId, { page, limit }, status);

  res.status(200).json(results);
};
