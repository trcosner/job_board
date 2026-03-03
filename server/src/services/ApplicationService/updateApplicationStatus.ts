import { findByIdWithDetails, updateApplication as updateApplicationRecord } from '../../repositories/ApplicationRepository/index.js';
import { findById as findCompanyById } from '../../repositories/CompanyRepository/index.js';
import { Application, UpdateApplicationStatusParams } from '../../types/application.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ForbiddenError } from '../../errors/ForbiddenError.js';
import { invalidateApplicationCaches } from './utils/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';

/**
 * Update application status (employer action)
 * - Verifies employer owns the company
 * - Updates application status
 * - Records status change in history (via trigger)
 * - Invalidates caches
 */
export async function updateApplicationStatus(
  employerId: string,
  applicationId: string,
  statusData: UpdateApplicationStatusParams
): Promise<Application> {
  const cacheService = new RedisCacheService();
  const application = await findByIdWithDetails(applicationId);
  if (!application) throw new NotFoundError();
  const company = await findCompanyById(application.company.id);
  if (!company) throw new NotFoundError();
  if (company.user_id !== employerId) throw new ForbiddenError('You do not have permission to update this application');
  const updatedApplication = await updateApplicationRecord(applicationId, {
    status: statusData.status,
    reviewed_at: new Date(),
    reviewed_by_user_id: statusData.reviewed_by_user_id,
    notes: statusData.notes,
  });
  await invalidateApplicationCaches(cacheService, application.job.id, application.company.id);
  return updatedApplication;
}
