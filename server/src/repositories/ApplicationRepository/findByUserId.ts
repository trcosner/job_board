import { query } from '../../database/connection.js';
import { ApplicationWithDetails } from '../../types/application.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';
import { calculateOffset, calculatePagination } from '../../utils/pagination.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function findByUserId(
  userId: string,
  pagination: PaginationParams,
  statusFilter?: string,
  jobIdFilter?: string
): Promise<PaginatedResponse<ApplicationWithDetails>> {
  const offset = calculateOffset(pagination.page, pagination.limit);

  // Build dynamic WHERE clauses and params
  const conditions: string[] = ['a.user_id = $1', 'a.deleted_at IS NULL'];
  const params: unknown[] = [userId];

  if (statusFilter) {
    params.push(statusFilter);
    conditions.push(`a.status = $${params.length}`);
  }
  if (jobIdFilter) {
    params.push(jobIdFilter);
    conditions.push(`a.job_id = $${params.length}`);
  }

  const whereClause = conditions.join(' AND ');

  try {
    // Count query (no pagination params)
    const countParams = [...params];
    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM applications a WHERE ${whereClause}`,
        countParams
      ),
      query<ApplicationWithDetails>(
        `SELECT a.*,
          json_build_object(
            'id', j.id, 'title', j.title, 'location', j.location, 'job_type', j.job_type
          ) as job,
          json_build_object(
            'id', c.id, 'name', c.name, 'slug', c.slug, 'logo_url', c.logo_url
          ) as company
         FROM applications a
         LEFT JOIN jobs j ON a.job_id = j.id
         LEFT JOIN companies c ON j.company_id = c.id
         WHERE ${whereClause}
         ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pagination.limit, offset]
      ),
    ]);
    const total = parseInt(countResult.rows[0].count, 10);
    return { data: dataResult.rows, pagination: calculatePagination(pagination.page, pagination.limit, total) };
  } catch (error) {
    throw new DatabaseError(`Error finding applications by user ID: ${error}`);
  }
}
