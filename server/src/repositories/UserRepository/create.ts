import { query } from '../../database/connection.js';
import type { User, CreateUserData } from '../../types/user.js';

/**
 * Create a new user
 */
export async function create(data: CreateUserData): Promise<User> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

  const sql = `
    INSERT INTO users (${columns.join(', ')})
    VALUES (${placeholders})
    RETURNING *
  `;

  try {
    const result = await query<User>(sql, values);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error creating user: ${error}`);
  }
}
