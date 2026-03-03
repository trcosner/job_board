import { findByIdWithDetails, softDelete as softDeleteApplication } from '../../repositories/ApplicationRepository/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';
import { ForbiddenError } from '../../errors/ForbiddenError.js';
import { verifyApplicationOwnership, invalidateApplicationCaches } from './utils/index.js';

/**
 * Delete application (soft delete - by applicant only if not reviewed)
 */
export async function deleteApplication(userId: string, applicationId: string): Promise<void> {
  const cacheService = new RedisCacheService();
  const application = await verifyApplicationOwnership(userId, applicationId);
  if (application.reviewed_at) throw new ForbiddenError('Cannot delete an application that has been reviewed');
  const applicationDetails = await findByIdWithDetails(applicationId);
  await softDeleteApplication(applicationId);

  // Invalidate caches
  if (applicationDetails) {
    await invalidateApplicationCaches(
      cacheService,
      applicationDetails.job.id,
      applicationDetails.company.id
    );
  }
}
