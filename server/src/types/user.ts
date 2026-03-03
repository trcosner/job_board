import type { BaseEntity } from './base.js';
import type { UserType } from './auth.js';

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
  company_id: string | null;
  onboarding_completed: boolean;
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
