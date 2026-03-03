import { findByUserAndJob, createApplication as createApplicationRecord } from '../../repositories/ApplicationRepository/index.js';
import { findById as findJobById } from '../../repositories/JobRepository/index.js';
import { RedisCacheService } from '../../cache/CacheService.js';
import { IFileStorage } from '../../types/storage.js';
import { getStorageService } from '../StorageService/index.js';
import { Readable } from 'stream';
import { Application, CreateApplicationParams } from '../../types/application.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { BadRequestError } from '../../errors/BadRequestError.js';
import { invalidateApplicationCaches, getFileExtension } from './utils/index.js';

/**
 * Create a new job application with resume upload
 * - Checks for duplicate application
 * - Uploads resume to S3
 * - Creates application record
 * - Invalidates related caches
 */
export async function createApplication(
  userId: string,
  data: Omit<CreateApplicationParams, 'user_id' | 'resume_url' | 'resume_filename'>,
  resumeFile: Express.Multer.File
): Promise<Application> {
  const cacheService = new RedisCacheService();
  const storageService: IFileStorage = getStorageService();
  const job = await findJobById(data.job_id);
  if (!job) {
    throw new NotFoundError();
  }

  if (job.status !== 'active') {
    throw new BadRequestError('This job is no longer accepting applications');
  }

  // Check if application deadline has passed
  if (job.application_deadline && new Date(job.application_deadline) < new Date()) {
    throw new BadRequestError('Application deadline has passed');
  }

  const existingApplication = await findByUserAndJob(userId, data.job_id);

  if (existingApplication) {
    throw new ConflictError('You have already applied to this job');
  }

  // Upload resume to S3
  const resumeKey = `applications/${userId}/${data.job_id}/resume-${Date.now()}${getFileExtension(resumeFile.originalname)}`;
  const stream = Readable.from(resumeFile.buffer);
  const uploadResult = await storageService.uploadStream(
    stream,
    resumeKey,
    { contentType: resumeFile.mimetype }
  );

  // Insert the DB record — if this fails we must clean up the uploaded S3 file
  // so we don't leave orphaned objects in storage (two-phase commit lite pattern)
  let application;
  try {
    application = await createApplicationRecord({
      job_id: data.job_id,
      user_id: userId,
      status: 'applied',
      resume_url: uploadResult.url,
      resume_filename: resumeFile.originalname,
      cover_letter: data.cover_letter || null,
      phone: data.phone || null,
      linkedin_url: data.linkedin_url || null,
      portfolio_url: data.portfolio_url || null,
      years_experience: data.years_experience ?? null,
      current_company: data.current_company || null,
      current_title: data.current_title || null,
      expected_salary: data.expected_salary ?? null,
      availability: data.availability || null,
      notes: null,
      reviewed_at: null,
      reviewed_by_user_id: null,
    });
  } catch (dbError) {
    // Best-effort S3 cleanup — log but don't mask the original DB error
    try {
      await storageService.delete(resumeKey);
    } catch (cleanupError) {
      // Log orphaned key so ops can purge it manually if needed
      const logger = (await import('../../utils/logger.js')).default;
      logger.error('Failed to clean up orphaned S3 file after DB insert failure', {
        resumeKey,
        cleanupError,
      });
    }
    throw dbError;
  }

  // Invalidate related caches
  await invalidateApplicationCaches(cacheService, data.job_id, job.company_id);

  return application;
}
