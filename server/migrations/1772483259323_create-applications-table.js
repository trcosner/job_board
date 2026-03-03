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
  // Create application_status enum type
  pgm.createType('application_status', ['applied', 'reviewing', 'interview', 'offer', 'hired', 'rejected']);

  pgm.createTable('applications', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    job_id: {
      type: 'uuid',
      notNull: true,
      references: 'jobs(id)',
      onDelete: 'CASCADE',
      comment: 'Job being applied to'
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
      comment: 'Job seeker applying'
    },
    status: {
      type: 'application_status',
      notNull: true,
      default: 'applied'
    },
    resume_url: {
      type: 'varchar(1000)',
      notNull: true,
      comment: 'S3 URL for resume file'
    },
    resume_filename: {
      type: 'varchar(255)',
      notNull: true,
      comment: 'Original filename of resume'
    },
    cover_letter: {
      type: 'text',
      notNull: false
    },
    phone: {
      type: 'varchar(20)',
      notNull: false
    },
    linkedin_url: {
      type: 'varchar(500)',
      notNull: false
    },
    portfolio_url: {
      type: 'varchar(500)',
      notNull: false
    },
    years_experience: {
      type: 'integer',
      notNull: false
    },
    current_company: {
      type: 'varchar(255)',
      notNull: false
    },
    current_title: {
      type: 'varchar(255)',
      notNull: false
    },
    expected_salary: {
      type: 'integer',
      notNull: false,
      comment: 'Expected salary in USD'
    },
    availability: {
      type: 'varchar(100)',
      notNull: false,
      comment: 'e.g., "2 weeks notice", "immediately"'
    },
    notes: {
      type: 'text',
      notNull: false,
      comment: 'Internal notes by employer (not visible to applicant)'
    },
    reviewed_at: {
      type: 'timestamp with time zone',
      notNull: false
    },
    reviewed_by_user_id: {
      type: 'uuid',
      notNull: false,
      references: 'users(id)',
      onDelete: 'SET NULL',
      comment: 'Employer who reviewed the application'
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
  // Composite index for employer querying applications by job and status
  pgm.createIndex('applications', ['job_id', 'status'], {
    name: 'idx_applications_job_status',
    where: 'deleted_at IS NULL'
  });

  // Index for job seeker's applications
  pgm.createIndex('applications', 'user_id', {
    name: 'idx_applications_user_id'
  });

  // Composite index for pipeline views (ordering by status and date)
  pgm.createIndex('applications', ['status', 'created_at'], {
    name: 'idx_applications_status_created',
    where: 'deleted_at IS NULL'
  });

  // Unique constraint - user can only apply once to each job
  pgm.addConstraint('applications', 'unique_application_per_job', {
    unique: ['job_id', 'user_id']
  });

  // Check constraint for expected salary
  pgm.addConstraint('applications', 'expected_salary_positive', {
    check: 'expected_salary IS NULL OR expected_salary > 0'
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('applications');
  pgm.dropType('application_status');
};
