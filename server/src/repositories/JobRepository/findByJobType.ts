import { query } from '../../database/connection.js';
import { Job } from '../../types/job.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';
import { calculateOffset, calculatePagination } from '../../utils/pagination.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function findByJobType(jobType: string, pagination: PaginationParams): Promise<PaginatedResponse<Job>> {
  const offset = calculateOffset(pagination.page, pagination.limit);
  try {
    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM jobs WHERE job_type = $1 AND status = 'active' AND deleted_at IS NULL`,
        [jobType]
      ),
      query<Job>(
        `SELECT * FROM jobs WHERE job_type = $1 AND status = 'active' AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [jobType, pagination.limit, offset]
      ),
    ]);
    const total = parseInt(countResult.rows[0].count, 10);
    return { data: dataResult.rows, pagination: calculatePagination(pagination.page, pagination.limit, total) };
  } catch (error) {
    throw new DatabaseError(`Error finding jobs by type: ${error}`);
  }
}
