/**
 * StatusBadge Component
 * Displays an application status with consistent color coding.
 */

import React from 'react';
import styles from './StatusBadge.module.css';
import type { ApplicationStatus } from '@/types/application';
import { APPLICATION_STATUS_LABELS } from '@/types/application';

export interface StatusBadgeProps {
  status: ApplicationStatus;
  /** Optional override label */
  label?: string;
  className?: string;
}

/**
 * Color-coded badge for application statuses.
 *
 * @example
 * <StatusBadge status="reviewing" />
 */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const displayLabel = label ?? APPLICATION_STATUS_LABELS[status] ?? status;

  return (
    <span
      className={[styles.badge, styles[`status-${status}`], className].filter(Boolean).join(' ')}
      role="status"
      aria-label={`Status: ${displayLabel}`}
    >
      {displayLabel}
    </span>
  );
}

export default StatusBadge;
