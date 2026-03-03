import { updateStatus as updateApplicationStatus, findByIdWithDetails } from '../../repositories/ApplicationRepository/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';
import { Application } from '../../types/application.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { verifyApplicationOwnership, invalidateApplicationCaches } from './utils/index.js';

/**
 * Withdraw application (by applicant)
 */
export async function withdrawApplication(userId: string, applicationId: string): Promise<Application> {
  const cacheService = new RedisCacheService();
  await verifyApplicationOwnership(userId, applicationId);
  const updatedApplication = await updateApplicationStatus(applicationId, 'withdrawn');
  if (!updatedApplication) throw new NotFoundError();
  const application = await findByIdWithDetails(applicationId);
  if (application) {
    await invalidateApplicationCaches(cacheService, application.job.id, application.company.id);
  }

  return updatedApplication;
}
