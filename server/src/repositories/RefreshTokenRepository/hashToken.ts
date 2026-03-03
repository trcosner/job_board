import crypto from 'crypto';

/**
 * Hash a plain token using SHA-256 for safe storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
