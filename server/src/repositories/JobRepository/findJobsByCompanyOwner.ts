import { query } from '../../database/connection.js';
import { JobWithCompany } from '../../types/job.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';
import { calculateOffset, calculatePagination } from '../../utils/pagination.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function findJobsByCompanyOwner(
  userId: string,
  pagination: PaginationParams,
  status?: string
): Promise<PaginatedResponse<JobWithCompany>> {
  const offset = calculateOffset(pagination.page, pagination.limit);
  try {
    const baseParams: unknown[] = [userId];
    const statusClause = status ? `AND j.status = $${baseParams.push(status)}` : '';
    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM jobs j
         JOIN companies c ON j.company_id = c.id
         WHERE c.user_id = $1 AND j.deleted_at IS NULL AND c.deleted_at IS NULL ${statusClause}`,
        baseParams
      ),
      query<JobWithCompany>(
        `SELECT j.*,
          json_build_object(
            'id', c.id, 'name', c.name, 'slug', c.slug, 'logo_url', c.logo_url
          ) as company
         FROM jobs j
         JOIN companies c ON j.company_id = c.id
         WHERE c.user_id = $1 AND j.deleted_at IS NULL AND c.deleted_at IS NULL ${statusClause}
         ORDER BY j.created_at DESC LIMIT $${baseParams.length + 1} OFFSET $${baseParams.length + 2}`,
        [...baseParams, pagination.limit, offset]
      ),
    ]);
    const total = parseInt(countResult.rows[0].count, 10);
    return { data: dataResult.rows, pagination: calculatePagination(pagination.page, pagination.limit, total) };
  } catch (error) {
    throw new DatabaseError(`Error finding jobs by company owner: ${error}`);
  }
}
