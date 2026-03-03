import { query } from '../../database/connection.js';
import { Company, CompanyWithStats, CompanyFilters } from '../../types/company.js';
import { PaginationParams, PaginatedResponse } from '../../types/pagination.js';
import { calculateOffset, calculatePagination } from '../../utils/pagination.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function searchCompanies(
  filters: CompanyFilters,
  pagination: PaginationParams
): Promise<PaginatedResponse<Company>> {
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.search) {
    conditions.push(`name ILIKE $${paramIndex}`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }
  if (filters.company_size) {
    conditions.push(`company_size = $${paramIndex}`);
    params.push(filters.company_size);
    paramIndex++;
  }
  if (filters.location) {
    conditions.push(`location ILIKE $${paramIndex}`);
    params.push(`%${filters.location}%`);
    paramIndex++;
  }
  if (filters.industry) {
    conditions.push(`industry ILIKE $${paramIndex}`);
    params.push(`%${filters.industry}%`);
    paramIndex++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const offset = calculateOffset(pagination.page, pagination.limit);

  try {
    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) as count FROM companies ${whereClause}`, params),
      query<Company>(
        `SELECT * FROM companies ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, pagination.limit, offset]
      ),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    return { data: dataResult.rows, pagination: calculatePagination(pagination.page, pagination.limit, total) };
  } catch (error) {
    throw new DatabaseError(`Error searching companies: ${error}`);
  }
}
