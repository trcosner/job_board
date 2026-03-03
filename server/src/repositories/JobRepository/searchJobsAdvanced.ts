import { query } from '../../database/connection.js';
import { JobWithCompany } from '../../types/job.js';
import { JobSearchFilters, JobSearchResult } from '../../types/job.js';
import { PaginatedResponse } from '../../types/pagination.js';
import { calculateOffset, calculatePagination } from '../../utils/pagination.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function searchJobsAdvanced(
  filters: JobSearchFilters,
  page: number,
  limit: number
): Promise<PaginatedResponse<JobSearchResult>> {
  const conditions: string[] = ['j.deleted_at IS NULL'];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.query) {
    conditions.push(
      `(j.title_search_vector @@ plainto_tsquery('english', $${paramIndex})
       OR j.description_search_vector @@ plainto_tsquery('english', $${paramIndex})
       OR j.location_search_vector @@ plainto_tsquery('english', $${paramIndex}))`
    );
    params.push(filters.query);
    paramIndex++;
  }
  if (filters.status) {
    conditions.push(`j.status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  } else {
    conditions.push(`j.status = 'active'`);
  }
  if (filters.job_type) {
    const jobTypes = Array.isArray(filters.job_type) ? filters.job_type : [filters.job_type];
    conditions.push(`j.job_type = ANY($${paramIndex})`);
    params.push(jobTypes);
    paramIndex++;
  }
  if (filters.experience_level) {
    const levels = Array.isArray(filters.experience_level) ? filters.experience_level : [filters.experience_level];
    conditions.push(`j.experience_level = ANY($${paramIndex})`);
    params.push(levels);
    paramIndex++;
  }
  if (filters.location) {
    conditions.push(`j.location ILIKE $${paramIndex}`);
    params.push(`%${filters.location}%`);
    paramIndex++;
  }
  if (filters.is_remote !== undefined) {
    conditions.push(`j.remote = $${paramIndex}`);
    params.push(filters.is_remote);
    paramIndex++;
  }
  if (filters.salary_min !== undefined) {
    conditions.push(`j.salary_max >= $${paramIndex}`);
    params.push(filters.salary_min);
    paramIndex++;
  }
  if (filters.salary_max !== undefined) {
    conditions.push(`j.salary_min <= $${paramIndex}`);
    params.push(filters.salary_max);
    paramIndex++;
  }
  if (filters.company_id) {
    conditions.push(`j.company_id = $${paramIndex}`);
    params.push(filters.company_id);
    paramIndex++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const orderBy = filters.query
    ? `ORDER BY ts_rank(j.title_search_vector, plainto_tsquery('english', $1)) DESC, j.created_at DESC`
    : `ORDER BY j.created_at DESC`;

  const offset = calculateOffset(page, limit);

  try {
    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM jobs j ${whereClause}`,
        params
      ),
      query<JobSearchResult>(
        `SELECT j.*,
          json_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug,
            'logo_url', c.logo_url,
            'location', c.location,
            'industry', c.industry,
            'company_size', c.company_size
          ) as company
         FROM jobs j
         LEFT JOIN companies c ON j.company_id = c.id AND c.deleted_at IS NULL
         ${whereClause}
         ${orderBy}
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    return { data: dataResult.rows, pagination: calculatePagination(page, limit, total) };
  } catch (error) {
    throw new DatabaseError(`Error in advanced job search: ${error}`);
  }
}
