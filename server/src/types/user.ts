import { UserType } from './auth';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  userType: UserType;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Made optional for soft deletes
}

export interface CreateUserParams {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  userType: UserType;
}

export interface UpdateUserParams {
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: boolean;
}
