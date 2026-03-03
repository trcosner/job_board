import { query } from '../../database/connection.js';
import { Company } from '../../types/company.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function createCompany(data: Omit<Company, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Company> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

  try {
    const result = await query<Company>(
      `INSERT INTO companies (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return result.rows[0];
  } catch (error) {
    throw new DatabaseError(`Error creating company: ${error}`);
  }
}
