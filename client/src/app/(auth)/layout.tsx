/**
 * Auth Layout - Shared layout for authentication pages
 * Provides centered container for login/register forms
 */

import React from 'react';
import Link from 'next/link';
import styles from './layout.module.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>Job Board</span>
        </Link>
        
        {children}
      </div>
    </div>
  );
}
