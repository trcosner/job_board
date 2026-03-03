import { findById as findJobById } from '../../../repositories/JobRepository/index.js';
import { findById as findCompanyById } from '../../../repositories/CompanyRepository/index.js';
import { Job } from '../../../types/job.js';
import { NotFoundError } from '../../../errors/NotFoundError.js';
import { ForbiddenError } from '../../../errors/ForbiddenError.js';

/**
 * Verify that a user owns the company that posted a job
 * @throws NotFoundError if job doesn't exist
 * @throws ForbiddenError if user doesn't own the company
 * @returns The job if ownership is verified
 */
export async function verifyJobOwnership(userId: string, jobId: string): Promise<Job> {
  const job = await findJobById(jobId);
  if (!job) throw new NotFoundError();
  const company = await findCompanyById(job.company_id);
  if (!company) throw new NotFoundError();
  if (company.user_id !== userId) throw new ForbiddenError('You do not own this job posting');
  return job;
}
