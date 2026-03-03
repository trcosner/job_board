import { searchCompanies as searchCompaniesInDB } from '../../repositories/CompanyRepository/index.js';
import { Company, CompanyFilters } from '../../types/company.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';

/**
 * Search companies with filters
 */
export async function searchCompanies(
  filters: CompanyFilters,
  pagination: PaginationParams
): Promise<PaginatedResponse<Company>> {
  return searchCompaniesInDB(filters, pagination);
}
