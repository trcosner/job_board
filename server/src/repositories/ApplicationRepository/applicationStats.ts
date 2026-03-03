import { query } from '../../database/connection.js';
import { ApplicationStats } from '../../types/application.js';
import { DatabaseError } from '../../errors/DatabaseError.js';

export async function getJobApplicationStats(jobId: string): Promise<ApplicationStats> {
  try {
    const result = await query<ApplicationStats>(
      `SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_applications,
        COUNT(*) FILTER (WHERE status = 'applied' AND deleted_at IS NULL) as pending_count,
        COUNT(*) FILTER (WHERE status = 'reviewing' AND deleted_at IS NULL) as reviewing_count,
        0 as shortlisted_count,
        COUNT(*) FILTER (WHERE status = 'interview' AND deleted_at IS NULL) as interviewing_count,
        COUNT(*) FILTER (WHERE status = 'offer' AND deleted_at IS NULL) as offered_count,
        COUNT(*) FILTER (WHERE status = 'hired' AND deleted_at IS NULL) as hired_count,
        COUNT(*) FILTER (WHERE status = 'rejected' AND deleted_at IS NULL) as rejected_count,
        COUNT(*) FILTER (WHERE status = 'withdrawn' AND deleted_at IS NULL) as withdrawn_count
       FROM applications WHERE job_id = $1`,
      [jobId]
    );
    return result.rows[0];
  } catch (error) {
    throw new DatabaseError(`Error getting job application stats: ${error}`);
  }
}

export async function getCompanyApplicationStats(companyId: string): Promise<ApplicationStats> {
  try {
    const result = await query<ApplicationStats>(
      `SELECT
        COUNT(*) FILTER (WHERE a.deleted_at IS NULL) as total_applications,
        COUNT(*) FILTER (WHERE a.status = 'applied' AND a.deleted_at IS NULL) as pending_count,
        COUNT(*) FILTER (WHERE a.status = 'reviewing' AND a.deleted_at IS NULL) as reviewing_count,
        0 as shortlisted_count,
        COUNT(*) FILTER (WHERE a.status = 'interview' AND a.deleted_at IS NULL) as interviewing_count,
        COUNT(*) FILTER (WHERE a.status = 'offer' AND a.deleted_at IS NULL) as offered_count,
        COUNT(*) FILTER (WHERE a.status = 'hired' AND a.deleted_at IS NULL) as hired_count,
        COUNT(*) FILTER (WHERE a.status = 'rejected' AND a.deleted_at IS NULL) as rejected_count,
        COUNT(*) FILTER (WHERE a.status = 'withdrawn' AND a.deleted_at IS NULL) as withdrawn_count
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE j.company_id = $1`,
      [companyId]
    );
    return result.rows[0];
  } catch (error) {
    throw new DatabaseError(`Error getting company application stats: ${error}`);
  }
}

export async function getUserApplicationStats(userId: string): Promise<ApplicationStats> {
  try {
    const result = await query<ApplicationStats>(
      `SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_applications,
        COUNT(*) FILTER (WHERE status = 'applied' AND deleted_at IS NULL) as pending_count,
        COUNT(*) FILTER (WHERE status = 'reviewing' AND deleted_at IS NULL) as reviewing_count,
        0 as shortlisted_count,
        COUNT(*) FILTER (WHERE status = 'interview' AND deleted_at IS NULL) as interviewing_count,
        COUNT(*) FILTER (WHERE status = 'offer' AND deleted_at IS NULL) as offered_count,
        COUNT(*) FILTER (WHERE status = 'hired' AND deleted_at IS NULL) as hired_count,
        COUNT(*) FILTER (WHERE status = 'rejected' AND deleted_at IS NULL) as rejected_count,
        COUNT(*) FILTER (WHERE status = 'withdrawn' AND deleted_at IS NULL) as withdrawn_count
       FROM applications WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  } catch (error) {
    throw new DatabaseError(`Error getting user application stats: ${error}`);
  }
}
