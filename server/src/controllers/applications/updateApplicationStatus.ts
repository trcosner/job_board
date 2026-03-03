import { Request, Response } from 'express';
import { updateApplicationStatus } from '../../services/ApplicationService/index.js';

/**
 * Update application status (employer action)
 * PATCH /api/applications/:id/status
 */
export const updateApplicationStatusController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const applicationId = req.params.id as string;
  const { status, notes } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  const validStatuses = ['applied', 'reviewing', 'interview', 'offer', 'hired', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const application = await updateApplicationStatus(userId, applicationId, {
    status,
    reviewed_by_user_id: userId,
    notes,
  });

  res.status(200).json({ application });
};
