import { query } from '../../database/connection.js';

/**
 * Hard delete user (permanently remove from database)
 */
export async function deleteUser(id: string): Promise<boolean> {
  const sql = `
    DELETE FROM users
    WHERE id = $1
    RETURNING id
  `;

  try {
    const result = await query(sql, [id]);
    return result.rows.length > 0;
  } catch (error) {
    throw new Error(`Error deleting user: ${error}`);
  }
}
