import { BaseEntity } from './base.js';

/**
 * Company size categories
 */
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';

/**
 * Company entity from database
 */
export interface Company extends BaseEntity {
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  industry: string | null;
  company_size: CompanySize | null;
  location: string | null;
  user_id: string; // Owner
}

/**
 * Parameters for creating a new company
 */
export interface CreateCompanyParams {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logo_url?: string;
  industry?: string;
  company_size?: CompanySize;
  location?: string;
  user_id: string;
}

/**
 * Parameters for updating a company
 */
export interface UpdateCompanyParams {
  name?: string;
  slug?: string;
  description?: string | null;
  website?: string | null;
  logo_url?: string | null;
  industry?: string | null;
  company_size?: CompanySize | null;
  location?: string | null;
}

/**
 * Company data with additional computed fields
 */
export interface CompanyWithStats extends Company {
  jobs_count?: number;
  active_jobs_count?: number;
  total_applications_count?: number;
}

/**
 * Filters for searching companies
 */
export interface CompanyFilters {
  search?: string;
  company_size?: CompanySize;
  location?: string;
  industry?: string;
}
