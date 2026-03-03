import { findBySlug } from '../../repositories/CompanyRepository/index.js';
import { Company } from '../../types/company.js';

/**
 * Get company by slug (public endpoint)
 */
export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  return findBySlug(slug);
}
