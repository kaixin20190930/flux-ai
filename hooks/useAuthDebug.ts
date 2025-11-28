'use client';

import { useEffect, useCallback } from 'react';
import { authStateDebugger } from '../utils/authStateDebugger';

/**
 * Hook to integrate authentication debugging with components
 */
export const useAuthDebug = (componentName: string) => {
  useEffect(() => {
    // Log component mount
    authStateDebugger.log('debug', 'component_mount', { componentName });

    return () => {
      // Log component unmount
      authStateDebugger.log('debug', 'component_unmount', { componentName });
    };
  }, [componentName]);

  const logAuthAction = useCallback((action: string, data: any) => {
    authStateDebugger.log('info', `${componentName}_${action}`, data);
  }, [componentName]);

  const logAuthError = useCallback((action: string, error: any) => {
    authStateDebugger.log('error', `${componentName}_${action}_error`, error);
  }, [componentName]);

  const takeSnapshot = useCallback(() => {
    return authStateDebugger.takeSnapshot();
  }, []);

  const checkConsistency = useCallback(() => {
    return authStateDebugger.checkConsistency();
  }, []);

  return {
    logAuthAction,
    logAuthError,
    takeSnapshot,
    checkConsistency
  };
};

/**
 * Hook to monitor authentication state changes
 */
export const useAuthStateMonitor = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor localStorage changes
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;

    localStorage.setItem = function(key: string, value: string) {
      if (key.includes('auth') || key === 'token' || key === 'user') {
        authStateDebugger.log('info', 'localStorage_set', { key, value });
      }
      return originalSetItem.call(this, key, value);
    };

    localStorage.removeItem = function(key: string) {
      if (key.includes('auth') || key === 'token' || key === 'user') {
        authStateDebugger.log('info', 'localStorage_remove', { key });
      }
      return originalRemoveItem.call(this, key);
    };

    // Monitor cookie changes
    let lastCookies = document.cookie;
    const cookieMonitor = setInterval(() => {
      if (document.cookie !== lastCookies) {
        authStateDebugger.log('info', 'cookie_change', {
          old: lastCookies,
          new: document.cookie
        });
        lastCookies = document.cookie;
      }
    }, 1000);

    return () => {
      // Restore original methods
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
      clearInterval(cookieMonitor);
    };
  }, []);
};

/**
 * Hook for automatic consistency checking
 */
export const useAuthConsistencyChecker = (intervalMs: number = 5000) => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const interval = setInterval(() => {
      const inconsistencies = authStateDebugger.checkConsistency();
      if (inconsistencies.length > 0) {
        authStateDebugger.log('warn', 'consistency_issues_detected', {
          count: inconsistencies.length,
          issues: inconsistencies.map(i => i.type)
        });
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);
};