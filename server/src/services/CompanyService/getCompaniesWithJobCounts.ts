import { findAllWithJobCounts } from '../../repositories/CompanyRepository/index.js';
import { Company, CompanyWithStats } from '../../types/company.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';

/**
 * Get all companies with job counts
 */
export async function getCompaniesWithJobCounts(
  pagination: PaginationParams,
  filters?: Partial<Pick<Company, 'company_size' | 'industry' | 'location'>>
): Promise<PaginatedResponse<CompanyWithStats>> {
  return findAllWithJobCounts(pagination, filters);
}
