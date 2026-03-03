import { query } from '../../database/connection.js';
import { JobWithCompany } from '../../types/job.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function findJobWithCompany(id: string): Promise<JobWithCompany | null> {
  try {
    const result = await query<JobWithCompany>(
      `SELECT j.*,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'logo_url', c.logo_url,
          'location', c.location,
          'website', c.website,
          'description', c.description,
          'company_size', c.company_size,
          'industry', c.industry
        ) as company
       FROM jobs j
       LEFT JOIN companies c ON j.company_id = c.id AND c.deleted_at IS NULL
       WHERE j.id = $1 AND j.deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error finding job with company: ${error}`);
  }
}
