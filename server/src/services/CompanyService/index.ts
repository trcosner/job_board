/**
 * CompanyService - Modular service functions for company operations
 * Each function is self-contained and can be imported individually
 */

export { createCompany } from './createCompany.js';
export { updateCompany } from './updateCompany.js';
export { uploadCompanyLogo } from './uploadCompanyLogo.js';
export { getCompanyById } from './getCompanyById.js';
export { getCompanyBySlug } from './getCompanyBySlug.js';
export { getCompanyWithStats } from './getCompanyWithStats.js';
export { getCompanyWithStatsBySlug } from './getCompanyWithStatsBySlug.js';
export { getUserCompany } from './getUserCompany.js';
export { searchCompanies } from './searchCompanies.js';
export { getCompaniesWithJobCounts } from './getCompaniesWithJobCounts.js';
export { deleteCompany } from './deleteCompany.js';
export { verifyCompanyOwnership } from './verifyCompanyOwnership.js';

// Export utilities
export * from './utils/index.js';
