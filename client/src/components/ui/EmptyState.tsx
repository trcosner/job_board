/**
 * EmptyState Component
 * Consistent empty-state placeholder with optional icon, title, description, and CTA.
 */

import React from 'react';
import Link from 'next/link';
import styles from './EmptyState.module.css';

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export interface EmptyStateProps {
  /** Large illustrative icon/emoji or SVG node */
  icon?: React.ReactNode;
  title: string;
  description?: string;
  /** Up to 2 CTA buttons / links */
  actions?: EmptyStateAction[];
  className?: string;
}

/**
 * Generic empty state for lists, search results, etc.
 *
 * @example
 * <EmptyState
 *   icon="📋"
 *   title="No applications yet"
 *   description="Your applications will appear here once you apply to jobs."
 *   actions={[{ label: 'Browse Jobs', href: '/jobs' }]}
 * />
 */
export function EmptyState({ icon, title, description, actions, className }: EmptyStateProps) {
  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')} role="status">
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {actions && actions.length > 0 && (
        <div className={styles.actions}>
          {actions.map((action, index) => {
            const cls = [
              styles.actionBtn,
              action.variant === 'secondary' ? styles.secondary : styles.primary,
            ].join(' ');

            if (action.href) {
              return (
                <Link key={index} href={action.href} className={cls}>
                  {action.label}
                </Link>
              );
            }

            return (
              <button key={index} type="button" className={cls} onClick={action.onClick}>
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
