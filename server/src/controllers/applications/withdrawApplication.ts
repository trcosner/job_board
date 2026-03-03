import { Request, Response } from 'express';
import { withdrawApplication } from '../../services/ApplicationService/index.js';

/**
 * Withdraw an application (applicant action)
 * POST /api/applications/:id/withdraw
 */
export const withdrawApplicationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const applicationId = req.params.id as string;

  const application = await withdrawApplication(userId, applicationId);

  res.status(200).json({ application });
};
