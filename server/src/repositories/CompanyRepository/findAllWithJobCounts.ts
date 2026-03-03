import { query } from '../../database/connection.js';
import { Company, CompanyWithStats } from '../../types/company.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';
import { calculateOffset, calculatePagination } from '../../utils/pagination.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function findAllWithJobCounts(
  pagination: PaginationParams,
  filters: Partial<Pick<Company, 'company_size' | 'industry' | 'location'>> = {}
): Promise<PaginatedResponse<CompanyWithStats>> {
  const conditions: string[] = ['c.deleted_at IS NULL'];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.company_size) {
    conditions.push(`c.company_size = $${paramIndex}`);
    params.push(filters.company_size);
    paramIndex++;
  }
  if (filters.industry) {
    conditions.push(`c.industry ILIKE $${paramIndex}`);
    params.push(`%${filters.industry}%`);
    paramIndex++;
  }
  if (filters.location) {
    conditions.push(`c.location ILIKE $${paramIndex}`);
    params.push(`%${filters.location}%`);
    paramIndex++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = calculateOffset(pagination.page, pagination.limit);

  try {
    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(DISTINCT c.id) as count FROM companies c ${whereClause}`,
        params
      ),
      query<CompanyWithStats>(
        `SELECT c.*,
          COUNT(DISTINCT j.id) FILTER (WHERE j.deleted_at IS NULL AND j.status = 'active') as active_jobs_count,
          COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL) as total_applications_count
         FROM companies c
         LEFT JOIN jobs j ON c.id = j.company_id
         LEFT JOIN applications a ON j.id = a.job_id
         ${whereClause}
         GROUP BY c.id
         ORDER BY c.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, pagination.limit, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    return { data: dataResult.rows, pagination: calculatePagination(pagination.page, pagination.limit, total) };
  } catch (error) {
    throw new DatabaseError(`Error finding companies with job counts: ${error}`);
  }
}
