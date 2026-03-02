/**
 * Register Page
 */

import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ROUTES } from '@/lib/constants';
import styles from '../login/page.module.css';

export default function RegisterPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <RegisterForm />
        
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Already have an account?{' '}
            <Link href={ROUTES.LOGIN} className={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
