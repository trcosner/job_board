import { query } from '../../database/connection.js';

/**
 * Soft delete user
 */
export async function softDelete(id: string): Promise<boolean> {
  const sql = `
    UPDATE users
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id
  `;

  try {
    const result = await query(sql, [id]);
    return result.rows.length > 0;
  } catch (error) {
    throw new Error(`Error soft deleting user: ${error}`);
  }
}
