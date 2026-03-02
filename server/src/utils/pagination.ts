import { PaginationMeta, PaginationParams } from '../types/pagination';

/**
 * Calculate pagination metadata
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @param total - Total number of items
 * @returns Pagination metadata object
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Calculate SQL OFFSET from page number
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Offset value for SQL query
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Validate and sanitize pagination parameters
 * @param params - Pagination parameters
 * @returns Validated pagination parameters
 */
export function validatePaginationParams(
  params: Partial<PaginationParams>
): PaginationParams {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(Math.max(1, params.limit || 20), 100); // Max 100 items per page
  
  return { page, limit };
}
