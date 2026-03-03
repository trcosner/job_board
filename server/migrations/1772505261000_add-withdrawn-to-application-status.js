/**
 * Add 'withdrawn' value to the application_status enum.
 * The TypeScript ApplicationStatus type already includes 'withdrawn' but the DB
 * enum was missing it, causing a 500 on any query that filters by that value.
 */

export const shorthands = undefined;

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  pgm.sql(`ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'withdrawn'`);
};

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const down = (_pgm) => {
  // Postgres does not support removing enum values directly.
  // A full rollback would require recreating the type — intentional no-op.
};
