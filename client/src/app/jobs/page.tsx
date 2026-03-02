/**
 * Jobs Page - Placeholder for jobs listing
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';
import styles from './page.module.css';

export default function JobsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Jobs</h1>
        <p className={styles.subtitle}>
          Job listings coming soon! This feature is under development.
        </p>
        <Link href={ROUTES.HOME}>
          <Button variant="primary">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
