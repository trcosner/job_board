import { findById as findApplicationById } from '../../../repositories/ApplicationRepository/index.js';
import { Application } from '../../../types/application.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';
import { ForbiddenError } from '../../../errors/ForbiddenError.js';

/**
 * Verify that a user owns an application
 * @throws NotFoundError if application doesn't exist
 * @throws ForbiddenError if user doesn't own the application
 * @returns The application if ownership is verified
 */
export async function verifyApplicationOwnership(userId: string, applicationId: string): Promise<Application> {
  const application = await findApplicationById(applicationId);
  
  if (!application) {
    throw new NotFoundError();
  }

  if (application.user_id !== userId) {
    throw new ForbiddenError('You do not own this application');
  }

  return application;
}
