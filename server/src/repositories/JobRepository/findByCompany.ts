import { query } from '../../database/connection.js';
import { Job } from '../../types/job.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';
import { calculateOffset, calculatePagination } from '../../utils/pagination.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function findByCompany(
  companyId: string,
  pagination: PaginationParams,
  statusFilter?: string
): Promise<PaginatedResponse<Job>> {
  const offset = calculateOffset(pagination.page, pagination.limit);
  const statusClause = statusFilter ? `AND status = $2` : '';
  const params = statusFilter
    ? [companyId, statusFilter, pagination.limit, offset]
    : [companyId, pagination.limit, offset];
  const limitIdx = statusFilter ? 3 : 2;
  const offsetIdx = statusFilter ? 4 : 3;

  try {
    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM jobs WHERE company_id = $1 ${statusClause} AND deleted_at IS NULL`,
        statusFilter ? [companyId, statusFilter] : [companyId]
      ),
      query<Job>(
        `SELECT * FROM jobs WHERE company_id = $1 ${statusClause} AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params
      ),
    ]);
    const total = parseInt(countResult.rows[0].count, 10);
    return { data: dataResult.rows, pagination: calculatePagination(pagination.page, pagination.limit, total) };
  } catch (error) {
    throw new DatabaseError(`Error finding jobs by company: ${error}`);
  }
}

export async function findByCompanyId(
  companyId: string,
  pagination: PaginationParams,
  statusFilter?: string
): Promise<PaginatedResponse<Job>> {
  return findByCompany(companyId, pagination, statusFilter);
}
