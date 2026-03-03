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
  // Add company_id to users table
  pgm.addColumn('users', {
    company_id: {
      type: 'uuid',
      notNull: false,
      references: 'companies(id)',
      onDelete: 'SET NULL',
      comment: 'Company this user belongs to (for employers)'
    },
    onboarding_completed: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'Track if employer has completed company setup'
    }
  });

  // Index for finding users by company
  pgm.createIndex('users', 'company_id', {
    name: 'idx_users_company_id'
  });

  // Set onboarding_completed to true for existing job_seekers (they don't need company setup)
  pgm.sql("UPDATE users SET onboarding_completed = true WHERE user_type = 'job_seeker';");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropIndex('users', 'idx_users_company_id');
  pgm.dropColumn('users', ['company_id', 'onboarding_completed']);
};
