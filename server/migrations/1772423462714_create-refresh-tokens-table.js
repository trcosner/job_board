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
  pgm.createTable('refresh_tokens', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    token_hash: {
      type: 'varchar(512)',
      notNull: true,
      unique: true,
      comment: 'SHA-256 hash of the refresh token'
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
      comment: 'User who owns this refresh token'
    },
    expires_at: {
      type: 'timestamp with time zone',
      notNull: true,
      comment: 'When this token expires'
    },
    revoked_at: {
      type: 'timestamp with time zone',
      notNull: false,
      comment: 'When this token was revoked (null if active)'
    },
    revoked_by_token_id: {
      type: 'uuid',
      notNull: false,
      references: 'refresh_tokens(id)',
      onDelete: 'SET NULL',
      comment: 'If this token was replaced by another token (rotation)'
    },
    ip_address: {
      type: 'varchar(45)',
      notNull: false,
      comment: 'IP address where token was issued (supports IPv6)'
    },
    user_agent: {
      type: 'text',
      notNull: false,
      comment: 'User agent of the client that requested the token'
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Indexes for performance
  pgm.createIndex('refresh_tokens', 'token_hash', {
    name: 'idx_refresh_tokens_token_hash'
  });
  
  pgm.createIndex('refresh_tokens', 'user_id', {
    name: 'idx_refresh_tokens_user_id'
  });
  
  pgm.createIndex('refresh_tokens', 'expires_at', {
    name: 'idx_refresh_tokens_expires_at',
    comment: 'For cleanup of expired tokens'
  });

  // Composite index for finding active tokens for a user
  pgm.createIndex('refresh_tokens', ['user_id', 'revoked_at', 'expires_at'], {
    name: 'idx_refresh_tokens_active_user_tokens'
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('refresh_tokens');
};
