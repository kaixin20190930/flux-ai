'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { GOOGLE_TRACKING_ID } from '@/lib/env';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    __fluxAnalyticsUserId?: string;
  }
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const currentUserId = isAuthenticated ? user?.id : undefined;
  const search = searchParams.toString();
  const lastTrackedPagePathRef = useRef<string | null>(null);
  const lastTrackedPageLocationRef = useRef<string | null>(null);
  const hasSentInitialPageViewRef = useRef(false);
  const isReady = Boolean(GOOGLE_TRACKING_ID) && typeof window !== 'undefined';
  const [isGtagReady, setIsGtagReady] = useState(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (typeof window.gtag === 'function') {
      setIsGtagReady(true);
      return;
    }

    // Poll briefly for the injected gtag stub, but stop after a short window so blocked scripts do not keep a timer alive forever.
    let attempts = 0;
    const maxAttempts = 200;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (typeof window.gtag === 'function') {
        setIsGtagReady(true);
        window.clearInterval(timer);
        return;
      }

      if (attempts >= maxAttempts) {
        window.clearInterval(timer);
      }
    }, 50);

    return () => window.clearInterval(timer);
  }, [isReady]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (currentUserId) {
      window.__fluxAnalyticsUserId = currentUserId;
      return;
    }

    delete window.__fluxAnalyticsUserId;
  }, [currentUserId]);

  useEffect(() => {
    if (!isReady || !isGtagReady) {
      return;
    }

    // Keep page_view tied to route changes only; auth changes should not retrigger a view for the same page.
    const pagePath = search ? `${pathname}?${search}` : pathname;
    if (!hasSentInitialPageViewRef.current) {
      hasSentInitialPageViewRef.current = true;
      lastTrackedPagePathRef.current = pagePath;
      lastTrackedPageLocationRef.current = window.location.href;
      return;
    }
    if (lastTrackedPagePathRef.current === pagePath) {
      return;
    }
    const pageLocation = window.location.href;
    const pageReferrer = lastTrackedPageLocationRef.current || document.referrer || undefined;
    lastTrackedPagePathRef.current = pagePath;
    lastTrackedPageLocationRef.current = pageLocation;

    window.gtag?.('event', 'page_view', {
      page_path: pagePath,
      page_location: pageLocation,
      page_referrer: pageReferrer,
      page_title: document.title,
      user_id: currentUserId,
    });
  }, [isGtagReady, isReady, pathname, search]);

  useEffect(() => {
    if (!isReady || !isGtagReady || isLoading) {
      return;
    }

    // Update user_id separately once auth settles, without creating another page_view.
    window.gtag?.('config', GOOGLE_TRACKING_ID, {
      send_page_view: false,
      user_id: currentUserId,
    });
  }, [currentUserId, isGtagReady, isLoading, isReady]);

  return null;
}
