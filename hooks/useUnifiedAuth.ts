import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types/user';
import { unifiedAuthManager } from '@/utils/unifiedAuthManager';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  userPoints: number | null;
  loading: boolean;
}

interface AuthApiResponse {
  remainingFreeGenerations: number;
  isLoggedIn: boolean;
  userPoints: number;
  userId: string | null;
}

/**
 * Legacy hook for backward compatibility
 * Uses the new UnifiedAuthManager under the hood
 * @deprecated Use useUnifiedAuthManager instead
 */
export function useUnifiedAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoggedIn: false,
    userPoints: null,
    loading: true,
  });

  // Subscribe to unified auth manager
  useEffect(() => {
    const unsubscribe = unifiedAuthManager.subscribe((state) => {
      setAuthState({
        user: state.user,
        isLoggedIn: state.isAuthenticated,
        userPoints: state.userPoints,
        loading: state.loading
      });
    });

    return unsubscribe;
  }, []);

  const refreshAuth = useCallback(async () => {
    await unifiedAuthManager.refreshAuth();
  }, []);

  const logout = useCallback(async () => {
    await unifiedAuthManager.logout();
  }, []);

  // Legacy fetchAuthData method for backward compatibility
  const fetchAuthData = useCallback(async () => {
    await refreshAuth();
  }, [refreshAuth]);

  return {
    ...authState,
    refreshAuth,
    logout,
    fetchAuthData // For backward compatibility
  };
}