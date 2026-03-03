import { softDelete as deleteCompanyRecord } from '../../repositories/CompanyRepository/index.js';
import { update as updateUserRecord } from '../../repositories/UserRepository/index.js';
import { verifyCompanyOwnership } from './verifyCompanyOwnership.js';
import { withTransaction } from '../../utils/transactions.js';

/**
 * Delete company (soft delete)
 * - Verifies user owns the company
 * - Soft deletes company
 * - Removes company_id from user
 */
export async function deleteCompany(userId: string, companyId: string): Promise<void> {
  await verifyCompanyOwnership(userId, companyId);
  await withTransaction(async () => {
    await deleteCompanyRecord(companyId);
    await updateUserRecord(userId, {
      company_id: null,
      onboarding_completed: false,
    });
  });
}
