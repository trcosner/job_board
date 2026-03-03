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
  pgm.createTable('application_status_history', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()')
    },
    application_id: {
      type: 'uuid',
      notNull: true,
      references: 'applications(id)',
      onDelete: 'CASCADE',
      comment: 'Application this history entry belongs to'
    },
    from_status: {
      type: 'varchar(50)',
      notNull: false,
      comment: 'Previous status (null for initial status)'
    },
    to_status: {
      type: 'varchar(50)',
      notNull: true,
      comment: 'New status'
    },
    changed_by_user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
      comment: 'User who made the status change'
    },
    notes: {
      type: 'text',
      notNull: false,
      comment: 'Optional notes about the status change'
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Index for retrieving history timeline
  pgm.createIndex('application_status_history', ['application_id', 'created_at'], {
    name: 'idx_application_history_timeline'
  });

  // Index for finding status changes by user
  pgm.createIndex('application_status_history', 'changed_by_user_id', {
    name: 'idx_application_history_user'
  });

  // Create trigger to automatically log status changes
  pgm.sql(`
    CREATE OR REPLACE FUNCTION log_application_status_change()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Only log if status actually changed
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO application_status_history (
          application_id,
          from_status,
          to_status,
          changed_by_user_id,
          notes,
          created_at
        ) VALUES (
          NEW.id,
          OLD.status::varchar,
          NEW.status::varchar,
          NEW.reviewed_by_user_id,
          NEW.notes,
          CURRENT_TIMESTAMP
        );
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER applications_status_change_trigger
    AFTER UPDATE ON applications
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION log_application_status_change();
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS applications_status_change_trigger ON applications;');
  pgm.sql('DROP FUNCTION IF EXISTS log_application_status_change();');
  pgm.dropTable('application_status_history');
};
