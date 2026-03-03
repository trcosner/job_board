import { query } from '../../database/connection.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function incrementViewCount(id: string): Promise<void> {
  try {
    await query(
      `UPDATE jobs SET views_count = views_count + 1 WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
  } catch (error) {
    throw new DatabaseError(`Error incrementing view count: ${error}`);
  }
}
