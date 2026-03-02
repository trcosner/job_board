// Simple database exports - keep it minimal!

export { 
  createPool, 
  getPool, 
  closePool,
  query,
  startSessionTracking,
  pool 
} from './connection';

export { 
  checkHealth, 
  testConnection, 
  ping 
} from './health';

// Re-export useful pg types
export type { Pool, PoolClient, QueryResult } from 'pg';