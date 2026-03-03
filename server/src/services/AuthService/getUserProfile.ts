import { findById } from '../../repositories/UserRepository/index.js';
import type { UserProfile } from '../../types/index.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import { mapUserToProfile } from './utils/index.js';
import logger from '../../utils/logger.js';

/**
 * Get user profile by ID
 * - Fetches user from database
 * - Returns user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    const user = await findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return mapUserToProfile(user);
  } catch (error) {
    logger.error('Failed to get user profile', { error, userId });
    throw error;
  }
}
