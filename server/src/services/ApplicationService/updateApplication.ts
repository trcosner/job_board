import { updateApplication as updateApplicationRecord } from '../../repositories/ApplicationRepository/index.js';
import { Application, UpdateApplicationParams } from '../../types/application.js';
import { verifyApplicationOwnership } from './utils/index.js';

/**
 * Update application details (by applicant)
 * - Verifies user owns the application
 * - Updates application fields
 */
export async function updateApplication(
  userId: string,
  applicationId: string,
  data: UpdateApplicationParams
): Promise<Application> {
  await verifyApplicationOwnership(userId, applicationId);
  const { notes, ...allowedUpdates } = data;
  return updateApplicationRecord(applicationId, allowedUpdates);
}
