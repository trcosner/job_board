// Central type exports for the job board application

// Base entity types
export * from './base';

// Auth types
export * from './auth';

// Event types
export * from './events';

// User types
export * from './user';

// Express/Request types
export * from './express';

// Error types
export * from './error';

// Cache types
export * from './cache';

// Storage types
export * from './storage';

// Company types
export * from './company';

// Job types
export * from './job';

// Application types
export * from './application';

// Pagination types
export * from './pagination';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;