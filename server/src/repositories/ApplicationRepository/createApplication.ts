import { query } from '../../database/connection.js';
import type { Application } from '../../types/application.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function createApplication(
  data: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
): Promise<Application> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

  try {
    const result = await query<Application>(
      `INSERT INTO applications (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return result.rows[0];
  } catch (error) {
    throw new DatabaseError(`Error creating application: ${error}`);
  }
}
