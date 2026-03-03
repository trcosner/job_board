import { Request, Response } from 'express';
import { getApplicationsByUser } from '../../services/ApplicationService/index.js';

/**
 * Get current user's applications (job seeker view)
 * GET /api/applications/my-applications
 */
export const getMyApplicationsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as any;
  const jobId = req.query.job_id as string | undefined;

  const results = await getApplicationsByUser(userId, { page, limit }, status, jobId);

  res.status(200).json(results);
};
