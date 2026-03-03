import { findBySlugWithStats } from '../../repositories/CompanyRepository/index.js';
import { CompanyWithStats } from '../../types/company.js';

/**
 * Get company with statistics by slug (public endpoint)
 */
export async function getCompanyWithStatsBySlug(
  slug: string
): Promise<CompanyWithStats | null> {
  return findBySlugWithStats(slug);
}
