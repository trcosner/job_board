import type { User } from '../../../types/user.js';
import type { UserProfile } from '../../../types/index.js';

/**
 * Map User entity to UserProfile
 */
export function mapUserToProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    userType: user.user_type,
    emailVerified: user.email_verified,
    createdAt: user.created_at,
  };
}
