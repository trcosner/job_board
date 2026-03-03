import { createJob as createJobRecord } from '../../repositories/JobRepository/index.js';
import { findById as findCompanyById } from '../../repositories/CompanyRepository/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';
import { Job, CreateJobParams } from '../../types/job.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ForbiddenError } from '../../errors/ForbiddenError.js';
import { invalidateJobCaches } from './utils/index.js';

/**
 * Create a new job posting
 * - Verifies company exists and user owns it
 * - Creates job record
 * - Invalidates related caches
 */
export async function createJob(userId: string, data: Omit<CreateJobParams, 'posted_by_user_id'>): Promise<Job> {
  const cacheService = new RedisCacheService();
  const company = await findCompanyById(data.company_id);
  if (!company) {
    throw new NotFoundError();
  }

  if (company.user_id !== userId) {
    throw new ForbiddenError('You do not own this company');
  }

  const job = await createJobRecord({
    title: data.title,
    description: data.description,
    company_id: data.company_id,
    posted_by_user_id: userId,
    location: data.location || null,
    job_type: data.job_type,
    remote: data.remote ?? false,
    salary_min: data.salary_min ?? null,
    salary_max: data.salary_max ?? null,
    required_skills: data.required_skills || [],
    experience_level: data.experience_level ?? null,
    application_deadline: data.application_deadline ?? null,
    is_featured: data.is_featured ?? false,
    status: data.status || 'draft',
    views_count: 0,
  });

  // Invalidate related caches
  await invalidateJobCaches(cacheService, data.company_id);

  return job;
}
