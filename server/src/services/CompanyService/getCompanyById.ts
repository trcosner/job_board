import { findById } from '../../repositories/CompanyRepository/index.js';
import { Company } from '../../types/company.js';

/**
 * Get company by ID
 */
export async function getCompanyById(companyId: string): Promise<Company | null> {
  return findById(companyId);
}
