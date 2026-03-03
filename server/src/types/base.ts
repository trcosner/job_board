/**
 * Base fields present on every database entity
 */
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

/**
 * Options for repository find operations
 */
export interface FindOptions {
  includeDeleted?: boolean;
  orderBy?: string;
  order?: 'ASC' | 'DESC';
}
