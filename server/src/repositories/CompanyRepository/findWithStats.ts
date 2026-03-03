import { query } from '../../database/connection.js';
import { CompanyWithStats } from '../../types/company.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

const STATS_SELECT = `
  c.*,
  COUNT(DISTINCT j.id) FILTER (WHERE j.deleted_at IS NULL) as active_jobs_count,
  COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL) as total_applications_count
FROM companies c
LEFT JOIN jobs j ON c.id = j.company_id AND j.status = 'active'
LEFT JOIN applications a ON j.id = a.job_id`;

export async function findByIdWithStats(id: string): Promise<CompanyWithStats | null> {
  try {
    const result = await query<CompanyWithStats>(
      `SELECT ${STATS_SELECT} WHERE c.id = $1 AND c.deleted_at IS NULL GROUP BY c.id LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error finding company with stats: ${error}`);
  }
}

export async function findBySlugWithStats(slug: string): Promise<CompanyWithStats | null> {
  try {
    const result = await query<CompanyWithStats>(
      `SELECT ${STATS_SELECT} WHERE c.slug = $1 AND c.deleted_at IS NULL GROUP BY c.id LIMIT 1`,
      [slug]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error finding company with stats by slug: ${error}`);
  }
}
