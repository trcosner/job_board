/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },    
    email: { 
      type: 'varchar(320)',  // RFC 5321 max email length
      notNull: true, 
      unique: true 
    },    
    password_hash: { 
      type: 'varchar(512)',  // Supports longer hashes
      notNull: true 
    },
    deleted_at: {
      type: 'timestamp with time zone',
      notNull: false
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
    }
  });

  // Indexes for performance
  pgm.createIndex('users', 'email');
  
  // Partial index for non-deleted users only
  pgm.createIndex('users', 'email', { 
    where: 'deleted_at IS NULL',
    name: 'idx_users_email_active' 
  });

  // Constraint to ensure email is lowercase
  pgm.addConstraint('users', 'email_lowercase', {
    check: 'email = lower(email)'
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('users');
  // Note: We don't drop the extension as other tables might use it
};
