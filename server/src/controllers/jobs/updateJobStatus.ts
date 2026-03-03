import { Request, Response } from 'express';
import { updateJobStatus } from '../../services/JobService/index.js';

/**
 * Update job status (activate, close, draft)
 * PATCH /api/jobs/:id/status
 */
export const updateJobStatusController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const jobId = req.params.id as string;
  const { status } = req.body;

  if (!status || !['active', 'closed', 'draft'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const job = await updateJobStatus(userId, jobId, status);

  res.status(200).json(job);
};
