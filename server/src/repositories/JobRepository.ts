import { BaseRepository, BaseEntity } from './BaseRepository.js';

/**
 * Job entity matching the database schema
 * TODO: Update this based on your actual jobs table schema
 */
export interface Job extends BaseEntity {
  title: string;
  description: string;
  company_id: string;
  location: string | null;
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship';
  remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  status: 'active' | 'closed' | 'draft';
  views_count: number;
}

/**
 * Data for creating a new job
 */
export type CreateJobData = Omit<
  Job,
  'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'views_count'
> & {
  views_count?: number;
};

/**
 * Data for updating a job
 */
export type UpdateJobData = Partial<Omit<Job, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;

/**
 * Job repository with custom job-specific methods
 */
export class JobRepository extends BaseRepository<Job> {
  protected tableName = 'jobs';

  /**
   * Find active jobs (not deleted, status = 'active')
   */
  async findActiveJobs(page: number, limit: number) {
    return this.findPaginated(
      { page, limit },
      { status: 'active' } as Partial<Job>,
      { orderBy: 'created_at', order: 'DESC' }
    );
  }

  /**
   * Find jobs by company
   */
  async findByCompany(companyId: string, page: number, limit: number) {
    return this.findPaginated(
      { page, limit },
      { company_id: companyId } as Partial<Job>,
      { orderBy: 'created_at', order: 'DESC' }
    );
  }

  /**
   * Find jobs by type
   */
  async findByJobType(
    jobType: Job['job_type'],
    page: number,
    limit: number
  ) {
    return this.findPaginated(
      { page, limit },
      { job_type: jobType } as Partial<Job>,
      { orderBy: 'created_at', order: 'DESC' }
    );
  }

  /**
   * Find remote jobs
   */
  async findRemoteJobs(page: number, limit: number) {
    return this.findPaginated(
      { page, limit },
      { remote: true } as Partial<Job>,
      { orderBy: 'created_at', order: 'DESC' }
    );
  }

  /**
   * Increment view count for a job
   */
  async incrementViewCount(id: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET views_count = views_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
    `;

    try {
      await this.pool.query(query, [id]);
    } catch (error) {
      throw new Error(`Error incrementing view count: ${error}`);
    }
  }

  /**
   * Close a job (set status to 'closed')
   */
  async closeJob(id: string): Promise<Job> {
    return this.update(id, { status: 'closed' } as Partial<Job>);
  }

  /**
   * Activate a job (set status to 'active')
   */
  async activateJob(id: string): Promise<Job> {
    return this.update(id, { status: 'active' } as Partial<Job>);
  }

  /**
   * Search jobs by title or description
   */
  async searchJobs(
    searchQuery: string,
    page: number,
    limit: number
  ) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE (
        title ILIKE $1 OR description ILIKE $1
      )
      AND status = 'active'
      AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as count FROM ${this.tableName}
      WHERE (
        title ILIKE $1 OR description ILIKE $1
      )
      AND status = 'active'
      AND deleted_at IS NULL
    `;

    try {
      const searchPattern = `%${searchQuery}%`;
      const [dataResult, countResult] = await Promise.all([
        this.pool.query<Job>(query, [searchPattern, limit, offset]),
        this.pool.query<{ count: string }>(countQuery, [searchPattern]),
      ]);

      const total = parseInt(countResult.rows[0].count, 10);
      const totalPages = Math.ceil(total / limit);

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      throw new Error(`Error searching jobs: ${error}`);
    }
  }

  /**
   * Get jobs count by status
   */
  async countByStatus(status: Job['status']): Promise<number> {
    return this.count({ status } as Partial<Job>);
  }
}
