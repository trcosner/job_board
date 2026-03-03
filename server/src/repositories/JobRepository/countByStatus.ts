import { query } from '../../database/connection.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function countByStatus(): Promise<Record<string, number>> {
  try {
    const result = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count FROM jobs WHERE deleted_at IS NULL GROUP BY status`
    );
    return result.rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {});
  } catch (error) {
    throw new DatabaseError(`Error counting jobs by status: ${error}`);
  }
}
