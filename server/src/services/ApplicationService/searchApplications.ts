import { searchApplications as searchApplicationsInDB } from '../../repositories/ApplicationRepository/index.js';
import { findById as findCompanyById } from '../../repositories/CompanyRepository/index.js';
import { ApplicationFilters, ApplicationWithDetails } from '../../types/application.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';
import { NotFoundError } from '../../errors/NotFoundError.js';
import { ForbiddenError } from '../../errors/ForbiddenError.js';

/**
 * Search applications with filters (employer dashboard)
 */
export async function searchApplications(
  employerId: string,
  filters: ApplicationFilters,
  pagination: PaginationParams
): Promise<PaginatedResponse<ApplicationWithDetails>> {
  if (filters.company_id) {
    const company = await findCompanyById(filters.company_id);
    if (!company) throw new NotFoundError();
    if (company.user_id !== employerId) throw new ForbiddenError('You do not have permission to view these applications');
  }
  return searchApplicationsInDB(filters, pagination);
}
