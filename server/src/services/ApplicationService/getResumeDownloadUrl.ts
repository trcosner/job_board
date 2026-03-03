import { findByIdWithDetails } from '../../repositories/ApplicationRepository/index.js';
import { findById as findCompanyById } from '../../repositories/CompanyRepository/index.js';
import { IFileStorage } from '../../types/storage.js';
import { getStorageService } from '../StorageService/index.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ForbiddenError } from '../../errors/ForbiddenError.js';
import { extractS3KeyFromUrl } from './utils/index.js';

// Signed URL expiry (in seconds)
const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour

/**
 * Get signed URL for resume download
 * - Verifies user has permission to access resume
 * - Generates temporary signed URL (1 hour expiry)
 */
export async function getResumeDownloadUrl(
  userId: string,
  applicationId: string,
  userType: 'employer' | 'applicant'
): Promise<string> {
  const storageService: IFileStorage = getStorageService();
  const application = await findByIdWithDetails(applicationId);
  if (!application) {
    throw new NotFoundError();
  }

  // Verify permission based on user type
  if (userType === 'applicant') {
    // Applicant can only download their own resume
    if (application.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to access this resume');
    }
  } else if (userType === 'employer') {
    // Employer must own the company
    const company = await findCompanyById(application.company.id);
    if (!company || company.user_id !== userId) {
      throw new ForbiddenError('You do not have permission to access this resume');
    }
  }

  // Extract S3 key from URL
  const s3Key = extractS3KeyFromUrl(application.resume_url);

  // Generate signed URL
  const signedUrl = await storageService.getSignedUrl(s3Key, {
    expiresIn: SIGNED_URL_EXPIRY,
  });

  return signedUrl;
}
