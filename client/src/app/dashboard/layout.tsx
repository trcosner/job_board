'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import styles from './layout.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const EMPLOYER_NAV: NavItem[] = [
  { label: 'Overview', href: ROUTES.DASHBOARD, icon: '🏠' },
  { label: 'My Jobs', href: ROUTES.DASHBOARD_JOBS, icon: '💼' },
  { label: 'All Applications', href: ROUTES.DASHBOARD_COMPANY_APPLICATIONS, icon: '📋' },
  { label: 'Company Profile', href: ROUTES.DASHBOARD_COMPANY, icon: '🏢' },
];

const SEEKER_NAV: NavItem[] = [
  { label: 'Overview', href: ROUTES.DASHBOARD, icon: '🏠' },
  { label: 'Find Jobs', href: ROUTES.JOBS, icon: '🔍' },
  { label: 'My Applications', href: ROUTES.DASHBOARD_APPLICATIONS, icon: '📋' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  const navItems = user?.userType === 'employer' ? EMPLOYER_NAV : SEEKER_NAV;

  function isActive(href: string): boolean {
    if (href === ROUTES.DASHBOARD) {
      return pathname === ROUTES.DASHBOARD;
    }
    return pathname.startsWith(href);
  }

  return (
    <div className={styles.wrapper}>
      {/* Sidebar */}
      <nav className={styles.sidebar} aria-label="Dashboard navigation">
        <ul className={styles.navList}>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ''}`}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                <span className={styles.navIcon} aria-hidden="true">
                  {item.icon}
                </span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main content */}
      <main className={styles.main}>{children}</main>
    </div>
  );
}
