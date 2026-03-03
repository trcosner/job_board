import { query } from '../../database/connection.js';
import { ApplicationWithDetails } from '../../types/application.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';
import { calculateOffset, calculatePagination } from '../../utils/pagination.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function findByJobId(
  jobId: string,
  pagination: PaginationParams,
  statusFilter?: string
): Promise<PaginatedResponse<ApplicationWithDetails>> {
  const offset = calculateOffset(pagination.page, pagination.limit);
  try {
    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM applications WHERE job_id = $1 ${statusFilter ? 'AND status = $2' : ''} AND deleted_at IS NULL`,
        statusFilter ? [jobId, statusFilter] : [jobId]
      ),
      query<ApplicationWithDetails>(
        `SELECT a.*,
          json_build_object(
            'id', u.id, 'first_name', u.first_name, 'last_name', u.last_name, 'email', u.email
          ) as applicant
         FROM applications a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.job_id = $1 ${statusFilter ? 'AND a.status = $2' : ''} AND a.deleted_at IS NULL
         ORDER BY a.created_at DESC LIMIT $${statusFilter ? 3 : 2} OFFSET $${statusFilter ? 4 : 3}`,
        statusFilter ? [jobId, statusFilter, pagination.limit, offset] : [jobId, pagination.limit, offset]
      ),
    ]);
    const total = parseInt(countResult.rows[0].count, 10);
    return { data: dataResult.rows, pagination: calculatePagination(pagination.page, pagination.limit, total) };
  } catch (error) {
    throw new DatabaseError(`Error finding applications by job ID: ${error}`);
  }
}
