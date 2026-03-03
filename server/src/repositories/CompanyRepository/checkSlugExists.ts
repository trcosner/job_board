import { query } from '../../database/connection.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function checkSlugExists(slug: string, excludeCompanyId?: string): Promise<boolean> {
  const params: any[] = [slug];
  const excludeClause = excludeCompanyId ? 'AND id != $2' : '';
  if (excludeCompanyId) params.push(excludeCompanyId);

  try {
    const result = await query(
      `SELECT 1 FROM companies WHERE slug = $1 AND deleted_at IS NULL ${excludeClause} LIMIT 1`,
      params
    );
    return result.rows.length > 0;
  } catch (error) {
    throw new DatabaseError(`Error checking slug existence: ${error}`);
  }
}
