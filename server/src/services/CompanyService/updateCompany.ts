import { updateCompany as updateCompanyRecord } from '../../repositories/CompanyRepository/index.js';
import { Company, UpdateCompanyParams } from '../../types/company.js';
import { generateUniqueSlug } from './utils/index.js';
import { verifyCompanyOwnership } from './verifyCompanyOwnership.js';

/**
 * Update company details
 * - Verifies user owns the company
 * - Regenerates slug if name changed
 * - Updates company record
 */
export async function updateCompany(
  userId: string,
  companyId: string,
  data: UpdateCompanyParams
): Promise<Company> {
  await verifyCompanyOwnership(userId, companyId);
  if (data.name) {
    const newSlug = await generateUniqueSlug(data.name, companyId);
    data.slug = newSlug;
  }
  return await updateCompanyRecord(companyId, data);
}
