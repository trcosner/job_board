import { findById } from '../../repositories/CompanyRepository/index.js';
import { Company } from '../../types/company.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ForbiddenError } from '../../errors/ForbiddenError.js';

/**
 * Verify that a user owns a company
 * @throws NotFoundError if company doesn't exist
 * @throws ForbiddenError if user doesn't own the company
 * @returns The company if ownership is verified
 */
export async function verifyCompanyOwnership(
  userId: string,
  companyId: string
): Promise<Company> {
  const company = await findById(companyId);

  if (!company) {
    throw new NotFoundError();
  }

  if (company.user_id !== userId) {
    throw new ForbiddenError('You do not own this company');
  }

  return company;
}
