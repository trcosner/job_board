/**
 * Timeline Component
 * Vertical timeline for displaying status history or activity sequences.
 */

import React from 'react';
import styles from './Timeline.module.css';

export interface TimelineItem {
  id: string;
  /** Icon text or emoji rendered inside the dot */
  icon?: React.ReactNode;
  /** Primary line of text */
  title: React.ReactNode;
  /** Secondary / descriptive text */
  description?: React.ReactNode;
  /** Timestamp label */
  timestamp?: string;
  /** Optional accent colour class applied to the dot */
  accentClass?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

/**
 * Vertical timeline list.
 *
 * @example
 * <Timeline
 *   items={history.map(h => ({
 *     id: h.id,
 *     title: h.new_status,
 *     description: h.notes,
 *     timestamp: new Date(h.created_at).toLocaleDateString(),
 *   }))}
 * />
 */
export function Timeline({ items, className }: TimelineProps) {
  if (items.length === 0) return null;

  return (
    <ol
      className={[styles.timeline, className].filter(Boolean).join(' ')}
      aria-label="Activity timeline"
    >
      {items.map((item, index) => (
        <li
          key={item.id}
          className={[
            styles.item,
            index === items.length - 1 ? styles.lastItem : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {/* Vertical connector line + dot */}
          <div className={styles.indicator}>
            <div className={[styles.dot, item.accentClass].filter(Boolean).join(' ')}>
              {item.icon}
            </div>
          </div>

          {/* Content */}
          <div className={styles.content}>
            <div className={styles.titleRow}>
              <span className={styles.title}>{item.title}</span>
              {item.timestamp && (
                <time className={styles.timestamp}>{item.timestamp}</time>
              )}
            </div>
            {item.description && (
              <div className={styles.description}>{item.description}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default Timeline;
