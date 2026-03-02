import { Pool, QueryResult, QueryResultRow } from 'pg';
import { getPool } from '../database/connection.js';
import { PaginatedResponse, PaginationParams } from '../types/pagination.js';
import { calculateOffset, calculatePagination } from '../utils/pagination.js';
import { DatabaseError } from '../errors/DatabaseError.js';
import { NotFoundError } from '../errors/NotFoundError.js';

/**
 * Base fields that all entities should have
 */
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

/**
 * Options for find operations
 */
export interface FindOptions {
  includeDeleted?: boolean;
  orderBy?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * Abstract base repository providing common CRUD operations
 * Extend this class for specific entity repositories
 */
export abstract class BaseRepository<T extends BaseEntity> {
  protected pool: Pool;
  protected abstract tableName: string;

  constructor() {
    this.pool = getPool();
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string, includeDeleted = false): Promise<T | null> {
    const deletedClause = includeDeleted ? '' : 'AND deleted_at IS NULL';
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE id = $1 ${deletedClause}
      LIMIT 1
    `;

    try {
      const result = await this.pool.query<T>(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError(`Error finding ${this.tableName} by ID: ${error}`);
    }
  }

  /**
   * Find a single record by custom filters
   */
  async findOne(
    filters: Partial<T>,
    options: FindOptions = {}
  ): Promise<T | null> {
    const { whereClause, values } = this.buildWhereClause(filters, options.includeDeleted);
    const query = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      LIMIT 1
    `;

    try {
      const result = await this.pool.query<T>(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError(`Error finding ${this.tableName}: ${error}`);
    }
  }

  /**
   * Find all records matching filters
   */
  async findAll(
    filters: Partial<T> = {},
    options: FindOptions = {}
  ): Promise<T[]> {
    const { whereClause, values } = this.buildWhereClause(filters, options.includeDeleted);
    const orderClause = options.orderBy
      ? `ORDER BY ${options.orderBy} ${options.order || 'DESC'}`
      : 'ORDER BY created_at DESC';

    const query = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ${orderClause}
    `;

    try {
      const result = await this.pool.query<T>(query, values);
      return result.rows;
    } catch (error) {
      throw new DatabaseError(`Error finding all ${this.tableName}: ${error}`);
    }
  }

  /**
   * Find records with pagination
   */
  async findPaginated(
    pagination: PaginationParams,
    filters: Partial<T> = {},
    options: FindOptions = {}
  ): Promise<PaginatedResponse<T>> {
    const { whereClause, values } = this.buildWhereClause(filters, options.includeDeleted);
    const offset = calculateOffset(pagination.page, pagination.limit);
    const orderClause = options.orderBy
      ? `ORDER BY ${options.orderBy} ${options.order || 'DESC'}`
      : 'ORDER BY created_at DESC';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count FROM ${this.tableName}
      ${whereClause}
    `;

    // Get paginated data
    const dataQuery = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ${orderClause}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    try {
      const [countResult, dataResult] = await Promise.all([
        this.pool.query<{ count: string }>(countQuery, values),
        this.pool.query<T>(dataQuery, [...values, pagination.limit, offset]),
      ]);

      const total = parseInt(countResult.rows[0].count, 10);
      const paginationMeta = calculatePagination(pagination.page, pagination.limit, total);

      return {
        data: dataResult.rows,
        pagination: paginationMeta,
      };
    } catch (error) {
      throw new DatabaseError(`Error finding paginated ${this.tableName}: ${error}`);
    }
  }

  /**
   * Create a new record
   */
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<T> {
    const { columns, placeholders, values } = this.buildInsertQuery(data);
    const query = `
      INSERT INTO ${this.tableName} (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;

    try {
      const result = await this.pool.query<T>(query, values);
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Error creating ${this.tableName}: ${error}`);
    }
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'created_at'>>): Promise<T> {
    const { setClause, values } = this.buildUpdateQuery(data);
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length + 1} AND deleted_at IS NULL
      RETURNING *
    `;

    try {
      const result = await this.pool.query<T>(query, [...values, id]);
      if (result.rows.length === 0) {
        throw new NotFoundError();
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Error updating ${this.tableName}: ${error}`);
    }
  }

  /**
   * Soft delete a record by ID
   */
  async softDelete(id: string): Promise<boolean> {
    const query = `
      UPDATE ${this.tableName}
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;

    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      throw new DatabaseError(`Error soft deleting ${this.tableName}: ${error}`);
    }
  }

  /**
   * Permanently delete a record by ID
   */
  async delete(id: string): Promise<boolean> {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE id = $1
      RETURNING id
    `;

    try {
      const result = await this.pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      throw new DatabaseError(`Error deleting ${this.tableName}: ${error}`);
    }
  }

  /**
   * Restore a soft-deleted record
   */
  async restore(id: string): Promise<T> {
    const query = `
      UPDATE ${this.tableName}
      SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NOT NULL
      RETURNING *
    `;

    try {
      const result = await this.pool.query<T>(query, [id]);
      if (result.rows.length === 0) {
        throw new NotFoundError();
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new DatabaseError(`Error restoring ${this.tableName}: ${error}`);
    }
  }

  /**
   * Check if a record exists
   */
  async exists(id: string, includeDeleted = false): Promise<boolean> {
    const deletedClause = includeDeleted ? '' : 'AND deleted_at IS NULL';
    const query = `
      SELECT 1 FROM ${this.tableName}
      WHERE id = $1 ${deletedClause}
      LIMIT 1
    `;

    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      throw new DatabaseError(`Error checking existence in ${this.tableName}: ${error}`);
    }
  }

  /**
   * Count records matching filters
   */
  async count(filters: Partial<T> = {}, includeDeleted = false): Promise<number> {
    const { whereClause, values } = this.buildWhereClause(filters, includeDeleted);
    const query = `
      SELECT COUNT(*) as count FROM ${this.tableName}
      ${whereClause}
    `;

    try {
      const result = await this.pool.query<{ count: string }>(query, values);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      throw new DatabaseError(`Error counting ${this.tableName}: ${error}`);
    }
  }

  /**
   * Build WHERE clause from filters
   */
  protected buildWhereClause(
    filters: Partial<T>,
    includeDeleted = false
  ): { whereClause: string; values: any[] } {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Add filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        conditions.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    // Add soft delete filter
    if (!includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, values };
  }

  /**
   * Build INSERT query parts
   */
  protected buildInsertQuery(data: any): {
    columns: string;
    placeholders: string;
    values: any[];
  } {
    const columns: string[] = [];
    const placeholders: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        columns.push(key);
        placeholders.push(`$${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    return {
      columns: columns.join(', '),
      placeholders: placeholders.join(', '),
      values,
    };
  }

  /**
   * Build UPDATE query SET clause
   */
  protected buildUpdateQuery(data: any): { setClause: string; values: any[] } {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    return {
      setClause: setClauses.join(', '),
      values,
    };
  }

  /**
   * Execute a raw query (for complex queries in child repositories)
   */
  protected async query<R extends QueryResultRow = any>(text: string, values?: any[]): Promise<QueryResult<R>> {
    try {
      return await this.pool.query<R>(text, values);
    } catch (error) {
      throw new DatabaseError(`Query error in ${this.tableName}: ${error}`);
    }
  }
}
