import { findByIdWithStats } from '../../repositories/CompanyRepository/index.js';
import { CompanyWithStats } from '../../types/company.js';

/**
 * Get company with statistics by ID
 */
export async function getCompanyWithStats(
  companyId: string
): Promise<CompanyWithStats | null> {
  return findByIdWithStats(companyId);
}
