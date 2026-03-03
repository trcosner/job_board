/**
 * Company Types - Client Side
 * Mirrors server/src/types/company.ts
 */

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  '1-10': '1–10 employees',
  '11-50': '11–50 employees',
  '51-200': '51–200 employees',
  '201-500': '201–500 employees',
  '501-1000': '501–1,000 employees',
  '1000+': '1,000+ employees',
};

/**
 * Company entity as returned by the API (snake_case, dates as ISO strings)
 */
export interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  industry: string | null;
  company_size: CompanySize | null;
  location: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Company with computed stats (returned on some list/detail endpoints)
 */
export interface CompanyWithStats extends Company {
  jobs_count?: number;
  active_jobs_count?: number;
  total_applications_count?: number;
}

/**
 * Data sent to POST /companies (create)
 */
export interface CreateCompanyData {
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  company_size?: CompanySize;
  location?: string;
}

/**
 * Data sent to PATCH /companies/:id (update)
 */
export interface UpdateCompanyData {
  name?: string;
  description?: string | null;
  website?: string | null;
  industry?: string | null;
  company_size?: CompanySize | null;
  location?: string | null;
}

/**
 * Query params for GET /companies
 */
export interface CompanyFilters {
  search?: string;
  company_size?: CompanySize;
  location?: string;
  industry?: string;
  page?: number;
  limit?: number;
}
