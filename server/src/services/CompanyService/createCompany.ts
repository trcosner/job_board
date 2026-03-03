import { createCompany as createCompanyRecord, findByUserId as findCompanyByUserId } from '../../repositories/CompanyRepository/index.js';
import { findById as findUserById, update as updateUserRecord } from '../../repositories/UserRepository/index.js';
import { Company, CreateCompanyParams } from '../../types/company.js';
import { ConflictError } from '../../errors/ConflictError.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ForbiddenError } from '../../errors/ForbiddenError.js';
import { generateUniqueSlug } from './utils/index.js';
import { withTransaction } from '../../utils/transactions.js';

/**
 * Create a new company (employer onboarding)
 * - Validates user doesn't already have a company
 * - Generates unique slug
 * - Creates company record
 * - Updates user.company_id and onboarding_completed
 * - Returns created company
 */
export async function createCompany(
  userId: string,
  data: Omit<CreateCompanyParams, 'user_id' | 'slug'>
): Promise<Company> {
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError();
  }

  if (user.user_type !== 'employer') {
    throw new ForbiddenError('Only employers can create companies');
  }

  if (user.company_id) {
    throw new ConflictError('User already has a company');
  }

  const slug = await generateUniqueSlug(data.name);
  return await withTransaction(async () => {
    const newCompany = await createCompanyRecord({
      name: data.name,
      slug,
      user_id: userId,
      description: data.description || null,
      website: data.website || null,
      logo_url: data.logo_url || null,
      industry: data.industry || null,
      company_size: data.company_size || null,
      location: data.location || null,
    });

    await updateUserRecord(userId, {
      company_id: newCompany.id,
      onboarding_completed: true,
    });
    return newCompany;
  });
}
