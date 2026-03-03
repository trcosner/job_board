import { query } from '../../database/connection.js';
import type { Application } from '../../types/application.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function findById(id: string): Promise<Application | null> {
  try {
    const result = await query<Application>(
      `SELECT * FROM applications WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error finding application by ID: ${error}`);
  }
}
