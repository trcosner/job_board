import { query } from '../../database/connection.js';
import { Company } from '../../types/company.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function updateCompany(
  id: string,
  data: Partial<Omit<Company, 'id' | 'created_at' | 'user_id'>>
): Promise<Company> {
  const entries = Object.entries(data);
  if (entries.length === 0) throw new Error('No data provided for update');

  const setClauses = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
  const values = [id, ...entries.map(([, v]) => v)];

  try {
    const result = await query<Company>(
      `UPDATE companies SET ${setClauses}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      values
    );
    if (!result.rows[0]) throw new DatabaseError('Company not found');
    return result.rows[0];
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Error updating company: ${error}`);
  }
}
