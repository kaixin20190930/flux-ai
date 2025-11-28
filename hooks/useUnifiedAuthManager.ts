import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  unifiedAuthManager, 
  AuthState, 
  LoginCredentials, 
  GoogleCredentials, 
  AuthResult 
} from '@/utils/unifiedAuthManager';
import { User } from '@/utils/userUtils';

/**
 * React hook for unified authentication management
 * Provides a clean interface to the UnifiedAuthManager with React integration
 */
export function useUnifiedAuthManager() {
  const [authState, setAuthState] = useState<AuthState>(unifiedAuthManager.getAuthState());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Subscribe to auth state changes
  useEffect(() => {
    unsubscribeRef.current = unifiedAuthManager.subscribe(setAuthState);
    
    // Refresh if state is stale
    unifiedAuthManager.refreshIfStale();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  // Login with email and password
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResult> => {
    return await unifiedAuthManager.login(credentials);
  }, []);

  // Login with Google OAuth
  const loginWithGoogle = useCallback(async (credentials: GoogleCredentials): Promise<AuthResult> => {
    return await unifiedAuthManager.loginWithGoogle(credentials);
  }, []);

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    await unifiedAuthManager.logout();
  }, []);

  // Refresh authentication state
  const refreshAuth = useCallback(async (): Promise<void> => {
    await unifiedAuthManager.refreshAuth();
  }, []);

  // Check if refresh is needed
  const shouldRefresh = useCallback((): boolean => {
    return unifiedAuthManager.shouldRefresh();
  }, []);

  // Get debug information (development only)
  const getDebugInfo = useCallback(() => {
    return unifiedAuthManager.getDebugInfo();
  }, []);

  // Derived state for convenience
  const isAuthenticated = authState.isAuthenticated;
  const user = authState.user;
  const token = authState.token;
  const userPoints = authState.userPoints;
  const loading = authState.loading;
  const error = authState.error;
  const lastUpdated = authState.lastUpdated;

  // Helper functions
  const isLoggedIn = isAuthenticated && !!user;
  const hasError = !!error;
  const isLoading = loading;

  return {
    // State
    authState,
    isAuthenticated,
    isLoggedIn,
    user,
    token,
    userPoints,
    loading,
    isLoading,
    error,
    hasError,
    lastUpdated,

    // Actions
    login,
    loginWithGoogle,
    logout,
    refreshAuth,

    // Utilities
    shouldRefresh,
    getDebugInfo
  };
}

/**
 * Hook for accessing only the authentication status
 * Lighter weight alternative when you only need to know if user is logged in
 */
export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    unifiedAuthManager.getAuthState().isAuthenticated
  );
  const [loading, setLoading] = useState(
    unifiedAuthManager.getAuthState().loading
  );

  useEffect(() => {
    const unsubscribe = unifiedAuthManager.subscribe((state) => {
      setIsAuthenticated(state.isAuthenticated);
      setLoading(state.loading);
    });

    return unsubscribe;
  }, []);

  return { isAuthenticated, loading };
}

/**
 * Hook for accessing only the current user
 * Useful when you only need user information
 */
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(
    unifiedAuthManager.getAuthState().user
  );
  const [loading, setLoading] = useState(
    unifiedAuthManager.getAuthState().loading
  );

  useEffect(() => {
    const unsubscribe = unifiedAuthManager.subscribe((state) => {
      setUser(state.user);
      setLoading(state.loading);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}

/**
 * Hook for accessing user points
 * Useful for components that only need to display/manage points
 */
export function useUserPoints() {
  const [userPoints, setUserPoints] = useState<number | null>(
    unifiedAuthManager.getAuthState().userPoints
  );
  const [loading, setLoading] = useState(
    unifiedAuthManager.getAuthState().loading
  );

  useEffect(() => {
    const unsubscribe = unifiedAuthManager.subscribe((state) => {
      setUserPoints(state.userPoints);
      setLoading(state.loading);
    });

    return unsubscribe;
  }, []);

  const refreshPoints = useCallback(async () => {
    await unifiedAuthManager.refreshAuth();
  }, []);

  return { userPoints, loading, refreshPoints };
}

/**
 * Hook for handling authentication errors
 * Provides error state and utilities for error handling
 */
export function useAuthError() {
  const [error, setError] = useState(unifiedAuthManager.getAuthState().error);

  useEffect(() => {
    const unsubscribe = unifiedAuthManager.subscribe((state) => {
      setError(state.error);
    });

    return unsubscribe;
  }, []);

  const clearError = useCallback(() => {
    // Note: This would require adding a clearError method to UnifiedAuthManager
    // For now, errors are cleared automatically on successful operations
    console.log('Error clearing not implemented yet');
  }, []);

  return { 
    error, 
    hasError: !!error,
    clearError 
  };
}

/**
 * Development hook for debugging authentication state
 * Only available in development mode
 */
export function useAuthDebug() {
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const updateDebugInfo = () => {
      setDebugInfo(unifiedAuthManager.getDebugInfo());
    };

    const unsubscribe = unifiedAuthManager.subscribe(updateDebugInfo);
    updateDebugInfo(); // Initial load

    return unsubscribe;
  }, []);

  const logState = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Auth Debug Information');
      console.log('Current state:', unifiedAuthManager.getAuthState());
      console.log('Debug info:', unifiedAuthManager.getDebugInfo());
      console.groupEnd();
    }
  }, []);

  const testLogin = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Testing login with test credentials...');
      const result = await unifiedAuthManager.login({
        email: 'test@example.com',
        password: 'test123'
      });
      console.log('Test login result:', result);
    }
  }, []);

  const testLogout = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Testing logout...');
      await unifiedAuthManager.logout();
      console.log('Test logout completed');
    }
  }, []);

  return {
    debugInfo,
    logState,
    testLogin,
    testLogout
  };
}

// Export the main hook as default
export default useUnifiedAuthManager;