/**
 * Central export for all event subscribers
 * Add new domain subscribers here as they are created
 */

export * from './auth.js';

// Export as a namespace for organized usage
export * as AuthSubscribers from './auth.js';

// TODO: Add more domain subscribers as needed
// export * as JobSubscribers from './job.js';
// export * as ApplicationSubscribers from './application.js';
