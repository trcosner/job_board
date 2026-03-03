'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * Ensures a logged-in employer has completed onboarding (created a company).
 * - Not authenticated → redirects to /login
 * - Not an employer → renders children (job seekers are always onboarded)
 * - Employer without company → redirects to /onboarding/company
 * - Employer with company → renders children
 */
export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, onboardingComplete, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    if (!onboardingComplete) {
      router.replace(ROUTES.ONBOARDING_COMPANY);
    }
  }, [user, onboardingComplete, loading, router]);

  if (loading) return null;
  if (!user) return null;
  if (user.userType === 'employer' && !onboardingComplete) return null;

  return <>{children}</>;
}
