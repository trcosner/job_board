import { findByJobId as findApplicationsByJobId } from '../../repositories/ApplicationRepository/index.js';
import { findById as findJobById } from '../../repositories/JobRepository/index.js';
import { findById as findCompanyById } from '../../repositories/CompanyRepository/index.js';
import { Application, ApplicationWithDetails } from '../../types/application.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ForbiddenError } from '../../errors/ForbiddenError.js';

/**
 * Get applications for a job (employer view)
 */
export async function getApplicationsForJob(
  employerId: string,
  jobId: string,
  pagination: PaginationParams,
  statusFilter?: Application['status']
): Promise<PaginatedResponse<ApplicationWithDetails>> {
  const job = await findJobById(jobId);
  if (!job) throw new NotFoundError();
  const company = await findCompanyById(job.company_id);
  if (!company) throw new NotFoundError();
  if (company.user_id !== employerId) throw new ForbiddenError('You do not have permission to view these applications');
  return findApplicationsByJobId(jobId, pagination, statusFilter);
}
