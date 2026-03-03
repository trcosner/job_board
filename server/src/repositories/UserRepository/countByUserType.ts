import { query } from '../../database/connection.js';
import type { UserType } from '../../types/auth.js';

/**
 * Get user count by type
 */
export async function countByUserType(userType: UserType): Promise<number> {
  const sql = `
    SELECT COUNT(*) as total FROM users
    WHERE user_type = $1 AND deleted_at IS NULL
  `;

  try {
    const result = await query<{ total: string }>(sql, [userType]);
    return parseInt(result.rows[0].total, 10);
  } catch (error) {
    throw new Error(`Error counting users by type: ${error}`);
  }
}
