import { TypedRequest, TypedResponse } from '../../types/express.js';
import { Application } from '../../types/application.js';
import { UpdateApplicationBody } from '../../schemas/applicationSchemas.js';
import { updateApplication } from '../../services/ApplicationService/index.js';

/**
 * Update application details (by applicant)
 * PATCH /api/applications/:id
 */
export const updateApplicationController = async (
  req: TypedRequest<UpdateApplicationBody>,
  res: TypedResponse<Application>
) => {
  const userId = req.user!.id;
  const applicationId = req.params.id as string;
  const updates = req.body;

  const application = await updateApplication(userId, applicationId, updates);

  res.status(200).json({ application });
};
