import { Request, Response } from 'express';
import { getApplicationById } from '../../services/ApplicationService/index.js';

/**
 * Get application by ID with full details
 * GET /api/applications/:id
 */
export const getApplicationController = async (req: Request, res: Response) => {
  const applicationId = req.params.id as string;

  const application = await getApplicationById(applicationId);

  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }

  res.status(200).json({ application });
};
