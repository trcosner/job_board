import { query } from '../../database/connection.js';
import type { User, UpdateUserData } from '../../types/user.js';

/**
 * Update user
 */
export async function update(id: string, data: UpdateUserData): Promise<User> {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    throw new Error('No data provided for update');
  }

  const setClauses = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
  const values = [id, ...entries.map(([, value]) => value)];

  const sql = `
    UPDATE users
    SET ${setClauses}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *
  `;

  try {
    const result = await query<User>(sql, values);
    if (result.rows.length === 0) {
      throw new Error(`User with id ${id} not found`);
    }
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error updating user: ${error}`);
  }
}
