import { BaseRepository, BaseEntity } from './BaseRepository.js';
import { UserType } from '../types/auth.js';

/**
 * User entity matching the database schema
 */
export interface User extends BaseEntity {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  user_type: UserType;
  email_verified: boolean;
  email_verification_token: string | null;
  verification_token_expires_at: Date | null;
}

/**
 * Data for creating a new user
 */
export type CreateUserData = Omit<
  User,
  'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'email_verified'
> & {
  email_verified?: boolean;
};

/**
 * Data for updating a user
 */
export type UpdateUserData = Partial<
  Omit<User, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'email'>
>;

/**
 * User repository with custom user-specific methods
 */
export class UserRepository extends BaseRepository<User> {
  protected tableName = 'users';

  /**
   * Find user by email (case-insensitive)
   */
  async findByEmail(email: string, includeDeleted = false): Promise<User | null> {
    const deletedClause = includeDeleted ? '' : 'AND deleted_at IS NULL';
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE LOWER(email) = LOWER($1) ${deletedClause}
      LIMIT 1
    `;

    try {
      const result = await this.pool.query<User>(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error}`);
    }
  }

  /**
   * Find user by verification token
   */
  async findByVerificationToken(token: string): Promise<User | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE email_verification_token = $1
        AND verification_token_expires_at > CURRENT_TIMESTAMP
        AND deleted_at IS NULL
      LIMIT 1
    `;

    try {
      const result = await this.pool.query<User>(query, [token]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error finding user by verification token: ${error}`);
    }
  }

  /**
   * Mark user email as verified
   */
  async markEmailAsVerified(id: string): Promise<User> {
    const query = `
      UPDATE ${this.tableName}
      SET email_verified = true,
          email_verification_token = NULL,
          verification_token_expires_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    try {
      const result = await this.pool.query<User>(query, [id]);
      if (result.rows.length === 0) {
        throw new Error(`User with id ${id} not found`);
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error marking email as verified: ${error}`);
    }
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, passwordHash: string): Promise<User> {
    const query = `
      UPDATE ${this.tableName}
      SET password_hash = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `;

    try {
      const result = await this.pool.query<User>(query, [passwordHash, id]);
      if (result.rows.length === 0) {
        throw new Error(`User with id ${id} not found`);
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating password: ${error}`);
    }
  }

  /**
   * Find users by type with pagination
   */
  async findByUserType(
    userType: UserType,
    page: number,
    limit: number
  ) {
    return this.findPaginated(
      { page, limit },
      { user_type: userType } as Partial<User>
    );
  }

  /**
   * Check if email already exists
   */
  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const excludeClause = excludeUserId ? 'AND id != $2' : '';
    const query = `
      SELECT 1 FROM ${this.tableName}
      WHERE LOWER(email) = LOWER($1) 
        AND deleted_at IS NULL
        ${excludeClause}
      LIMIT 1
    `;

    try {
      const values = excludeUserId ? [email, excludeUserId] : [email];
      const result = await this.pool.query(query, values);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Error checking email existence: ${error}`);
    }
  }

  /**
   * Get user count by type
   */
  async countByUserType(userType: UserType): Promise<number> {
    return this.count({ user_type: userType } as Partial<User>);
  }
}
