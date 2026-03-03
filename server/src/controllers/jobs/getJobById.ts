import { Request, Response } from 'express';
import { getJobWithCompany } from '../../services/JobService/index.js';

/**
 * Get job by ID with company details
 * GET /api/jobs/:id
 */
export const getJobByIdController = async (req: Request, res: Response) => {
  const jobId = req.params.id as string;

  const job = await getJobWithCompany(jobId);

  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  res.status(200).json({ job });
};
