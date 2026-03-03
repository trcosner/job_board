/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Create enum types for jobs
  pgm.createType('job_status', ['active', 'closed', 'draft']);
  pgm.createType('job_type', ['full_time', 'part_time', 'contract', 'internship']);
  pgm.createType('experience_level', ['entry', 'mid', 'senior', 'lead', 'executive']);

  // Create jobs table (if it doesn't exist, this is idempotent-ish approach)
  pgm.createTable('jobs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    title: {
      type: 'varchar(255)',
      notNull: true
    },
    description: {
      type: 'text',
      notNull: true
    },
    company_id: {
      type: 'uuid',
      notNull: true,
      references: 'companies(id)',
      onDelete: 'CASCADE',
      comment: 'Company posting the job'
    },
    posted_by_user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
      comment: 'User who posted the job'
    },
    location: {
      type: 'varchar(255)',
      notNull: false,
      comment: 'Job location (can be null for remote)'
    },
    job_type: {
      type: 'job_type',
      notNull: true,
      default: 'full_time'
    },
    remote: {
      type: 'boolean',
      notNull: true,
      default: false
    },
    salary_min: {
      type: 'integer',
      notNull: false,
      comment: 'Minimum salary in USD'
    },
    salary_max: {
      type: 'integer',
      notNull: false,
      comment: 'Maximum salary in USD'
    },
    required_skills: {
      type: 'text[]',
      notNull: false,
      default: pgm.func("'{}'"),
      comment: 'Array of required skills'
    },
    experience_level: {
      type: 'experience_level',
      notNull: false
    },
    application_deadline: {
      type: 'timestamp with time zone',
      notNull: false,
      comment: 'Deadline for applications'
    },
    is_featured: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'Featured/promoted listing'
    },
    status: {
      type: 'job_status',
      notNull: true,
      default: 'draft'
    },
    views_count: {
      type: 'integer',
      notNull: true,
      default: 0
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    deleted_at: {
      type: 'timestamp with time zone',
      notNull: false
    }
  });

  // Performance indexes
  pgm.createIndex('jobs', 'company_id', {
    name: 'idx_jobs_company_id'
  });
  
  pgm.createIndex('jobs', 'posted_by_user_id', {
    name: 'idx_jobs_posted_by_user'
  });
  
  // Composite index for active jobs (most common query)
  pgm.createIndex('jobs', ['status', 'created_at'], {
    name: 'idx_jobs_status_created',
    where: 'deleted_at IS NULL'
  });

  // GIN index for full-text search on title and description
  pgm.sql(`
    CREATE INDEX idx_jobs_search ON jobs 
    USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
  `);

  // GIN index for location search (using raw SQL for operator class)
  pgm.sql('CREATE INDEX idx_jobs_location_search ON jobs USING gin (location gin_trgm_ops);');

  // GIN index for skills array
  pgm.createIndex('jobs', 'required_skills', {
    name: 'idx_jobs_required_skills',
    method: 'gin'
  });

  // Check constraints
  pgm.addConstraint('jobs', 'salary_range_valid', {
    check: 'salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max'
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('jobs');
  pgm.dropType('experience_level');
  pgm.dropType('job_type');
  pgm.dropType('job_status');
};
