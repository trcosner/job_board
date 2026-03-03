import { query } from '../../database/connection.js';
import { ApplicationWithDetails, ApplicationFilters } from '../../types/application.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';
import { calculateOffset, calculatePagination } from '../../utils/pagination.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function searchApplications(
  filters: ApplicationFilters,
  pagination: PaginationParams
): Promise<PaginatedResponse<ApplicationWithDetails>> {
  const conditions: string[] = ['a.deleted_at IS NULL'];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.status) {
    conditions.push(`a.status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }
  if (filters.job_id) {
    conditions.push(`a.job_id = $${paramIndex}`);
    params.push(filters.job_id);
    paramIndex++;
  }
  if (filters.user_id) {
    conditions.push(`a.user_id = $${paramIndex}`);
    params.push(filters.user_id);
    paramIndex++;
  }
  if (filters.company_id) {
    conditions.push(`j.company_id = $${paramIndex}`);
    params.push(filters.company_id);
    paramIndex++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = calculateOffset(pagination.page, pagination.limit);

  try {
    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM applications a
         LEFT JOIN jobs j ON a.job_id = j.id
         ${whereClause}`,
        params
      ),
      query<ApplicationWithDetails>(
        `SELECT a.*,
          json_build_object('id', j.id, 'title', j.title, 'job_type', j.job_type) as job,
          json_build_object('id', c.id, 'name', c.name, 'logo_url', c.logo_url) as company,
          json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name, 'email', u.email) as applicant
         FROM applications a
         LEFT JOIN jobs j ON a.job_id = j.id
         LEFT JOIN companies c ON j.company_id = c.id
         LEFT JOIN users u ON a.user_id = u.id
         ${whereClause}
         ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, pagination.limit, offset]
      ),
    ]);
    const total = parseInt(countResult.rows[0].count, 10);
    return { data: dataResult.rows, pagination: calculatePagination(pagination.page, pagination.limit, total) };
  } catch (error) {
    throw new DatabaseError(`Error searching applications: ${error}`);
  }
}
