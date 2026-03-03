import { Request, Response } from 'express';
import { deleteJob } from '../../services/JobService/index.js';

/**
 * Delete job (soft delete)
 * DELETE /api/jobs/:id
 */
export const deleteJobController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const jobId = req.params.id as string;

  await deleteJob(userId, jobId);

  res.status(204).send();
};
