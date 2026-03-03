import { Request, Response } from 'express';
import { getApplicationsForJob } from '../../services/ApplicationService/index.js';

/**
 * Get applications for a specific job (employer view)
 * GET /api/jobs/:jobId/applications
 */
export const getJobApplicationsController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  // Support both /:id/applications (jobs router) and /:jobId/applications
  const jobId = (req.params.id ?? req.params.jobId) as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as any;

  const results = await getApplicationsForJob(userId, jobId, { page, limit }, status);

  res.status(200).json(results);
};
