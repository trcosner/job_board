/**
 * Dashboard Page - Role-aware hub for authenticated users
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';
import {
  Briefcase,
  PlusCircle,
  Building2,
  FileText,
  Search,
  ChevronRight,
} from 'lucide-react';
import styles from './page.module.css';

interface QuickActionCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
  accent?: boolean;
}

export default function DashboardPage() {
  const { user, userCompany, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(ROUTES.LOGIN);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isEmployer = user.userType === 'employer';

  const employerActions: QuickActionCard[] = [
    {
      icon: <PlusCircle size={24} />,
      title: 'Post a Job',
      description: 'Create a new job listing and start receiving applications',
      href: ROUTES.DASHBOARD_JOB_NEW,
      cta: 'Post Now',
      accent: true,
    },
    {
      icon: <Briefcase size={24} />,
      title: 'My Jobs',
      description: 'Manage your active, draft, and closed job listings',
      href: ROUTES.DASHBOARD_JOBS,
      cta: 'View Jobs',
    },
    {
      icon: <Building2 size={24} />,
      title: userCompany ? 'Company Profile' : 'Set Up Company',
      description: userCompany
        ? `Manage ${userCompany.name}'s profile and settings`
        : 'Complete your company profile to attract top talent',
      href: ROUTES.DASHBOARD_COMPANY,
      cta: userCompany ? 'View Profile' : 'Get Started',
      accent: !userCompany,
    },
  ];

  const seekerActions: QuickActionCard[] = [
    {
      icon: <Search size={24} />,
      title: 'Browse Jobs',
      description: 'Search thousands of open positions across all industries',
      href: ROUTES.JOBS,
      cta: 'Search Jobs',
      accent: true,
    },
    {
      icon: <FileText size={24} />,
      title: 'My Applications',
      description: 'Track the status of your submitted applications',
      href: ROUTES.DASHBOARD_APPLICATIONS,
      cta: 'View Applications',
    },
  ];

  const actions = isEmployer ? employerActions : seekerActions;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Page header */}
        <header className={styles.header}>
          <h1 className={styles.title}>
            Welcome back, {user.firstName}!
          </h1>
          <p className={styles.subtitle}>
            {isEmployer
              ? 'Manage your job listings and company profile'
              : 'Find your next opportunity'}
          </p>
        </header>

        {/* Quick action cards */}
        <section>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionGrid}>
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`${styles.actionCard} ${action.accent ? styles.actionCardAccent : ''}`}
              >
                <div className={`${styles.actionIcon} ${action.accent ? styles.actionIconAccent : ''}`}>
                  {action.icon}
                </div>
                <div className={styles.actionBody}>
                  <h3 className={styles.actionTitle}>{action.title}</h3>
                  <p className={styles.actionDesc}>{action.description}</p>
                </div>
                <div className={styles.actionCta}>
                  <span>{action.cta}</span>
                  <ChevronRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Profile card */}
        <section>
          <h2 className={styles.sectionTitle}>Your Profile</h2>
          <div className={styles.card}>
            <div className={styles.profileGrid}>
              <div className={styles.profileItem}>
                <span className={styles.profileLabel}>Name</span>
                <span className={styles.profileValue}>{user.firstName} {user.lastName}</span>
              </div>
              <div className={styles.profileItem}>
                <span className={styles.profileLabel}>Email</span>
                <span className={styles.profileValue}>{user.email}</span>
              </div>
              <div className={styles.profileItem}>
                <span className={styles.profileLabel}>Account Type</span>
                <span className={styles.profileValue}>
                  {isEmployer ? 'Employer' : 'Job Seeker'}
                </span>
              </div>
              <div className={styles.profileItem}>
                <span className={styles.profileLabel}>Member Since</span>
                <span className={styles.profileValue}>
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Sign out */}
        <div className={styles.signOutRow}>
          <Button variant="danger" onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
