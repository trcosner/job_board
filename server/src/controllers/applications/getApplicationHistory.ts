import { Request, Response } from 'express';
import { getApplicationStatusHistory } from '../../services/ApplicationService/index.js';

/**
 * Get application status history
 * GET /api/applications/:id/history
 */
export const getApplicationHistoryController = async (req: Request, res: Response) => {
  const applicationId = req.params.id as string;

  const history = await getApplicationStatusHistory(applicationId);

  res.status(200).json({ history });
};
