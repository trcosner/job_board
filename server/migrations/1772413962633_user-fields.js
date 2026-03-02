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
    pgm.addColumn('users', {
        first_name: {
            type: 'varchar(100)',
            notNull: true,
        },  
        last_name: {
            type: 'varchar(100)',
            notNull: true,
        },
        user_type: {
            type: 'varchar(50)',
            notNull: true,
        },
        email_verified: {
            type: 'boolean',
            notNull: true,
            default: false
        },
        email_verification_token: {
            type: 'varchar(255)',
            notNull: false  // Null when email is verified
        },
        verification_token_expires_at: {
            type: 'timestamp with time zone',
            notNull: false
        }
    });

    // Add CHECK constraint to validate user_type values
    pgm.addConstraint('users', 'user_type_check', {
        check: "user_type IN ('job_seeker', 'employer')"
    });

    // Index for filtering by user type
    pgm.createIndex('users', 'user_type');

    // Partial index for active verification tokens only (more efficient)
    pgm.createIndex('users', 'email_verification_token', {
        where: 'email_verification_token IS NOT NULL',
        name: 'idx_users_verification_token_active'
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropIndex('users', 'idx_users_verification_token_active');
    pgm.dropIndex('users', 'user_type');
    pgm.dropConstraint('users', 'user_type_check');
    pgm.dropColumn('users', [
        'first_name', 
        'last_name', 
        'user_type', 
        'email_verified',
        'email_verification_token',
        'verification_token_expires_at'
    ]);
};
