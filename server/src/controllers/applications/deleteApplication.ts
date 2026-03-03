import { Request, Response } from 'express';
import { deleteApplication } from '../../services/ApplicationService/index.js';

/**
 * Delete application (by applicant, only if not reviewed)
 * DELETE /api/applications/:id
 */
export const deleteApplicationController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const applicationId = req.params.id as string;

  await deleteApplication(userId, applicationId);

  res.status(204).send();
};
