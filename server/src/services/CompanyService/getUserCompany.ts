import { findByUserId } from '../../repositories/CompanyRepository/index.js';
import { Company } from '../../types/company.js';

/**
 * Get user's company (employer dashboard)
 */
export async function getUserCompany(userId: string): Promise<Company | null> {
  return findByUserId(userId);
}
