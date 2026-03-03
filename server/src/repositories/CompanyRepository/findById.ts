import { query } from '../../database/connection.js';
import { Company } from '../../types/company.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function findById(id: string, includeDeleted = false): Promise<Company | null> {
  const deletedClause = includeDeleted ? '' : 'AND deleted_at IS NULL';
  try {
    const result = await query<Company>(
      `SELECT * FROM companies WHERE id = $1 ${deletedClause} LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error finding company by ID: ${error}`);
  }
}
