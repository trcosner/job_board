import { query } from '../../database/connection.js';
import type { User } from '../../types/user.js';
import type { UserType } from '../../types/auth.js';

/**
 * Find users by type with pagination
 */
export async function findByUserType(
  userType: UserType,
  page: number,
  limit: number
): Promise<{ data: User[]; total: number; page: number; limit: number }> {
  const offset = (page - 1) * limit;
  
  const dataQuery = `
    SELECT * FROM users
    WHERE user_type = $1 AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  
  const countQuery = `
    SELECT COUNT(*) as total FROM users
    WHERE user_type = $1 AND deleted_at IS NULL
  `;

  try {
    const [dataResult, countResult] = await Promise.all([
      query<User>(dataQuery, [userType, limit, offset]),
      query<{ total: string }>(countQuery, [userType])
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
      page,
      limit
    };
  } catch (error) {
    throw new Error(`Error finding users by type: ${error}`);
  }
}
