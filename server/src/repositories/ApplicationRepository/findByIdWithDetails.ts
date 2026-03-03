import { query } from '../../database/connection.js';
import { ApplicationWithDetails } from '../../types/application.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function findByIdWithDetails(id: string): Promise<ApplicationWithDetails | null> {
  try {
    const result = await query<ApplicationWithDetails>(
      `SELECT a.*,
        json_build_object(
          'id', j.id, 'title', j.title, 'location', j.location,
          'job_type', j.job_type, 'salary_min', j.salary_min, 'salary_max', j.salary_max,
          'experience_level', j.experience_level, 'status', j.status
        ) as job,
        json_build_object(
          'id', c.id, 'name', c.name, 'slug', c.slug, 'logo_url', c.logo_url
        ) as company,
        json_build_object(
          'id', u.id, 'first_name', u.first_name, 'last_name', u.last_name,
          'email', u.email
        ) as applicant
       FROM applications a
       LEFT JOIN jobs j ON a.job_id = j.id
       LEFT JOIN companies c ON j.company_id = c.id
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.id = $1 AND a.deleted_at IS NULL LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    throw new DatabaseError(`Error finding application by ID with details: ${error}`);
  }
}
