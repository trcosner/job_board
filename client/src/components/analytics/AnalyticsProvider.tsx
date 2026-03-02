/**
 * Analytics Provider
 * Tracks page views and initializes analytics
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView, initializeAnalytics } from '@/lib/analytics';
import { reportWebVitals } from '@/lib/performance';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Initialize analytics and Web Vitals monitoring once
  useEffect(() => {
    initializeAnalytics();
    reportWebVitals();
  }, []);
  
  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);
  
  return <>{children}</>;
}
