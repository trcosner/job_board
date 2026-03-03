/**
 * Global Navbar — role-aware navigation component
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import {
  Briefcase,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Building2,
  FileText,
  ChevronDown,
  Search,
} from 'lucide-react';
import styles from './Navbar.module.css';

function getInitials(firstName?: string, lastName?: string): string {
  return `${(firstName?.[0] ?? '').toUpperCase()}${(lastName?.[0] ?? '').toUpperCase()}`;
}

export function Navbar() {
  const { user, userCompany, loading, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Don't render on auth pages (they have their own centered layout)
  // Must come AFTER all hook calls to satisfy Rules of Hooks
  const AUTH_PATHS = ['/login', '/register'];
  if (AUTH_PATHS.includes(pathname ?? '')) return null;

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  const isEmployer = user?.userType === 'employer';
  const isJobSeeker = user?.userType === 'job_seeker';

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        {/* Brand */}
        <Link href={ROUTES.HOME} className={styles.brand}>
          <span className={styles.brandName}>JobBoard</span>
        </Link>

        {/* Primary nav links */}
        <div className={styles.nav}>
          <Link
            href={ROUTES.JOBS}
            className={`${styles.navLink} ${isActive(ROUTES.JOBS) ? styles.navLinkActive : ''}`}
          >
            <Search size={15} />
            <span className={styles.navLinkLabel}>Browse Jobs</span>
          </Link>

          {isEmployer && (
            <>
              <Link
                href={ROUTES.DASHBOARD_JOBS}
                className={`${styles.navLink} ${isActive(ROUTES.DASHBOARD_JOBS) ? styles.navLinkActive : ''}`}
              >
                <Briefcase size={15} />
                <span className={styles.navLinkLabel}>My Jobs</span>
              </Link>
              <Link
                href={ROUTES.DASHBOARD_JOB_NEW}
                className={`${styles.navLink} ${styles.navLinkPrimary} ${isActive(ROUTES.DASHBOARD_JOB_NEW) ? styles.navLinkActive : ''}`}
              >
                <PlusCircle size={15} />
                <span className={styles.navLinkLabel}>Post a Job</span>
              </Link>
            </>
          )}

          {isJobSeeker && (
            <Link
              href={ROUTES.DASHBOARD_APPLICATIONS}
              className={`${styles.navLink} ${isActive(ROUTES.DASHBOARD_APPLICATIONS) ? styles.navLinkActive : ''}`}
            >
              <FileText size={15} />
              <span className={styles.navLinkLabel}>My Applications</span>
            </Link>
          )}
        </div>

        {/* Auth actions */}
        <div className={styles.actions}>
          {!mounted || loading ? null : !user ? (
            <>
              <Link
                href={ROUTES.LOGIN}
                className={styles.navLink}
              >
                Sign In
              </Link>
              <Link
                href={ROUTES.REGISTER}
                className={`${styles.navLink} ${styles.navLinkPrimary}`}
              >
                Register
              </Link>
            </>
          ) : (
            <div className={styles.userMenu} ref={menuRef}>
              <button
                className={styles.userMenuTrigger}
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <div className={styles.avatar}>
                  {getInitials(user.firstName, user.lastName)}
                </div>
                <span className={styles.userName}>{user.firstName}</span>
                <ChevronDown
                  size={14}
                  className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ''}`}
                />
              </button>

              {menuOpen && (
                <div className={styles.dropdown} role="menu">
                  {/* User info header */}
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownHeaderName}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div className={styles.dropdownHeaderEmail}>{user.email}</div>
                  </div>

                  {/* Navigation links */}
                  <div className={styles.dropdownSection}>
                    <Link href={ROUTES.DASHBOARD} className={styles.dropdownItem} role="menuitem">
                      <LayoutDashboard size={15} />
                      Dashboard
                    </Link>

                    {isEmployer && (
                      <>
                        <Link href={ROUTES.DASHBOARD_JOBS} className={styles.dropdownItem} role="menuitem">
                          <Briefcase size={15} />
                          My Jobs
                        </Link>
                        <Link href={ROUTES.DASHBOARD_JOB_NEW} className={styles.dropdownItem} role="menuitem">
                          <PlusCircle size={15} />
                          Post a Job
                        </Link>
                        <Link href={ROUTES.DASHBOARD_COMPANY} className={styles.dropdownItem} role="menuitem">
                          <Building2 size={15} />
                          {userCompany ? 'Company Profile' : 'Set Up Company'}
                        </Link>
                      </>
                    )}

                    {isJobSeeker && (
                      <Link href={ROUTES.DASHBOARD_APPLICATIONS} className={styles.dropdownItem} role="menuitem">
                        <FileText size={15} />
                        My Applications
                      </Link>
                    )}
                  </div>

                  {/* Sign out */}
                  <div className={styles.dropdownSection}>
                    <button
                      className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                      onClick={logout}
                      role="menuitem"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
