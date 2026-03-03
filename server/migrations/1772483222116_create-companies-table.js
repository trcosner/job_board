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
  // Create company_size enum type
  pgm.createType('company_size', ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']);

  pgm.createTable('companies', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    name: {
      type: 'varchar(255)',
      notNull: true
    },
    slug: {
      type: 'varchar(255)',
      notNull: true,
      unique: true
    },
    description: {
      type: 'text',
      notNull: false
    },
    website: {
      type: 'varchar(500)',
      notNull: false
    },
    logo_url: {
      type: 'varchar(1000)',
      notNull: false,
      comment: 'S3 URL for company logo'
    },
    industry: {
      type: 'varchar(100)',
      notNull: false
    },
    company_size: {
      type: 'company_size',
      notNull: false
    },
    location: {
      type: 'varchar(255)',
      notNull: false,
      comment: 'Company headquarters location'
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
      comment: 'Owner of the company'
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

  // Enable trigram extension for name search if not already enabled (must be done first)
  pgm.sql('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

  // Indexes for performance
  pgm.createIndex('companies', 'slug', {
    where: 'deleted_at IS NULL',
    name: 'idx_companies_slug_active',
    unique: true
  });
  
  pgm.createIndex('companies', 'user_id', {
    name: 'idx_companies_user_id'
  });
  
  // GIN index for name search (using raw SQL for operator class)
  pgm.sql('CREATE INDEX idx_companies_name_search ON companies USING gin (name gin_trgm_ops);');

  // Ensure slug is lowercase and URL-safe
  pgm.addConstraint('companies', 'slug_format', {
    check: "slug = lower(slug) AND slug ~ '^[a-z0-9-]+$'"
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('companies');
  pgm.dropType('company_size');
};
