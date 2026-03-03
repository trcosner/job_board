import { findByApplicationId } from '../../repositories/ApplicationStatusHistoryRepository/index.js';
import { ApplicationStatusHistory } from '../../types/application.js';

/**
 * Get status history for an application
 */
export async function getApplicationStatusHistory(applicationId: string): Promise<ApplicationStatusHistory[]> {
  return findByApplicationId(applicationId);
}
