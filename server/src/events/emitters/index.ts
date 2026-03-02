/**
 * Central export for all event emitters
 * Add new domain emitters here as they are created
 */

export * from './auth.js';

// Export as a namespace for organized usage
export * as AuthEmitters from './auth.js';

// TODO: Add more domain emitters as needed
// export * as JobEmitters from './job.js';
// export * as ApplicationEmitters from './application.js';
