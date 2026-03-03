import { updateCompany as updateCompanyRecord } from '../../repositories/CompanyRepository/index.js';
import { Company } from '../../types/company.js';
import { getStorageService } from '../StorageService/index.js';
import { Readable } from 'stream';
import { verifyCompanyOwnership } from './verifyCompanyOwnership.js';
import { getFileExtension, extractS3KeyFromUrl } from './utils/index.js';

/**
 * Upload company logo to S3
 * - Verifies user owns the company
 * - Uploads image to S3
 * - Updates company.logo_url
 * - Deletes old logo if exists
 */
export async function uploadCompanyLogo(
  userId: string,
  companyId: string,
  file: Express.Multer.File
): Promise<Company> {
  const storageService = getStorageService();
  const company = await verifyCompanyOwnership(userId, companyId);

  // Upload new logo to S3
  const key = `companies/${companyId}/logo-${Date.now()}${getFileExtension(file.originalname)}`;
  const stream = Readable.from(file.buffer);
  const uploadResult = await storageService.uploadStream(stream, key, {
    contentType: file.mimetype,
  });

  // Delete old logo if exists
  if (company.logo_url) {
    try {
      const oldKey = extractS3KeyFromUrl(company.logo_url);
      await storageService.delete(oldKey);
    } catch (error) {
      // Don't fail if old logo deletion fails
      console.error('Failed to delete old logo:', error);
    }
  }

  return await updateCompanyRecord(companyId, {
    logo_url: uploadResult.url,
  });
}
