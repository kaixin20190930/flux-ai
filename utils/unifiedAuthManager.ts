import { User } from '@/utils/userUtils';
import { AuthError, AuthErrorCode } from './authenticationService';
import { authErrorHandler } from './authErrorHandler';
import { logWithTimestamp } from './logUtils';
import { authSyncManager } from './authSyncManager';
import { authStateDebugger } from './authStateDebugger';

// Authentication state interface
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  userPoints: number | null;
  loading: boolean;
  error: AuthError | null;
  lastUpdated: number;
  sessionId: string | null;
}

// Login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
}

// Google OAuth credentials interface
export interface GoogleCredentials {
  token: string;
  email: string;
}

// Authentication result interface
export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: AuthError;
}

// Storage keys
const STORAGE_KEYS = {
  USER: 'user',
  TOKEN: 'token',
  SESSION_ID: 'auth_session_id',
  LAST_SYNC: 'auth_last_sync'
} as const;

// Events for cross-tab synchronization
const AUTH_EVENTS = {
  STATE_CHANGED: 'auth-state-changed',
  LOGIN: 'auth-login',
  LOGOUT: 'auth-logout',
  TOKEN_REFRESH: 'auth-token-refresh'
} as const;

/**
 * Unified Authentication Manager
 * Provides centralized authentication state management with automatic synchronization
 * between localStorage, cookies, and multiple browser tabs.
 */
export class UnifiedAuthManager {
  private state: AuthState;
  private listeners: Set<(state: AuthState) => void> = new Set();
  private apiCallInProgress = false;
  private refreshTimer: NodeJS.Timeout | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.state = this.getInitialState();
    
    if (typeof window !== 'undefined') {
      this.initializeBrowserFeatures();
      this.initializeCrossTabSync();
    }
  }

  /**
   * Initialize browser-specific features
   */
  private initializeBrowserFeatures(): void {
    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Listen for custom auth events
    window.addEventListener(AUTH_EVENTS.STATE_CHANGED, this.handleAuthEvent.bind(this) as EventListener);
    window.addEventListener(AUTH_EVENTS.LOGIN, this.handleAuthEvent.bind(this) as EventListener);
    window.addEventListener(AUTH_EVENTS.LOGOUT, this.handleAuthEvent.bind(this) as EventListener);
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
    window.addEventListener('offline', this.handleOnlineStatusChange.bind(this));
    
    // Set up periodic sync
    this.setupPeriodicSync();
    
    // Initialize state from storage
    this.loadFromStorage();
    
    this.isInitialized = true;
    
    // Development debugging
    if (process.env.NODE_ENV === 'development') {
      (window as any).unifiedAuthManager = this;
      (window as any).__authManager = this; // For debugger integration
      console.log('🔧 UnifiedAuthManager available: window.unifiedAuthManager');
      authStateDebugger.log('info', 'auth_manager_initialized', { isInitialized: true });
    }
  }

  /**
   * Initialize cross-tab synchronization
   */
  private initializeCrossTabSync(): void {
    // Subscribe to sync events from other tabs
    authSyncManager.subscribe((syncState) => {
      logWithTimestamp('Received sync state from another tab:', syncState);
      
      if (syncState.isAuthenticated !== this.state.isAuthenticated) {
        if (syncState.isAuthenticated) {
          // Another tab logged in - reload our state
          this.loadFromStorage();
        } else {
          // Another tab logged out - logout this tab too
          this.updateState({
            isAuthenticated: false,
            user: null,
            token: null,
            userPoints: null,
            sessionId: null,
            loading: false,
            error: null
          });
        }
      }
    });
  }

  /**
   * Get initial authentication state
   */
  private getInitialState(): AuthState {
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      userPoints: null,
      loading: true,
      error: null,
      lastUpdated: 0,
      sessionId: null
    };
  }

  /**
   * Load authentication state from storage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const userString = localStorage.getItem(STORAGE_KEYS.USER);
      const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
      const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      const hasToken = this.hasValidCookie();

      if (userString && hasToken && sessionId) {
        const user = JSON.parse(userString);
        const token = this.getTokenFromCookie();
        
        this.updateState({
          isAuthenticated: true,
          user,
          token,
          sessionId,
          lastUpdated: lastSync ? parseInt(lastSync) : Date.now(),
          loading: false,
          error: null
        });

        logWithTimestamp('Auth state loaded from storage:', { 
          userId: user.userId, 
          hasToken: !!token,
          sessionId 
        });
      } else {
        // Clear inconsistent state
        this.clearStorage();
        this.updateState({
          isAuthenticated: false,
          user: null,
          token: null,
          sessionId: null,
          loading: false,
          error: null,
          lastUpdated: Date.now()
        });
      }
    } catch (error) {
      console.error('Error loading auth state from storage:', error);
      this.clearStorage();
      this.updateState({
        isAuthenticated: false,
        user: null,
        token: null,
        sessionId: null,
        loading: false,
        error: authErrorHandler.handleAuthError(error, 'loadFromStorage'),
        lastUpdated: Date.now()
      });
    }
  }

  /**
   * Save authentication state to storage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      if (this.state.isAuthenticated && this.state.user && this.state.token) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.state.user));
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.state.lastUpdated.toString());
        
        if (this.state.sessionId) {
          localStorage.setItem(STORAGE_KEYS.SESSION_ID, this.state.sessionId);
        }

        // Set secure cookie
        this.setTokenCookie(this.state.token);
      } else {
        this.clearStorage();
      }
    } catch (error) {
      console.error('Error saving auth state to storage:', error);
    }
  }

  /**
   * Clear all authentication data from storage
   */
  private clearStorage(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
    
    // Clear token cookie
    this.clearTokenCookie();
  }

  /**
   * Set token cookie with security options
   */
  private setTokenCookie(token: string): void {
    if (typeof window === 'undefined') return;

    const isSecure = window.location.protocol === 'https:';
    const maxAge = 7 * 24 * 60 * 60; // 7 days
    
    const cookieOptions = [
      `${STORAGE_KEYS.TOKEN}=${token}`,
      'path=/',
      `max-age=${maxAge}`,
      'SameSite=Lax',
      ...(isSecure ? ['Secure'] : [])
    ];
    
    document.cookie = cookieOptions.join('; ');
  }

  /**
   * Clear token cookie
   */
  private clearTokenCookie(): void {
    if (typeof window === 'undefined') return;

    document.cookie = `${STORAGE_KEYS.TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  }

  /**
   * Get token from cookie
   */
  private getTokenFromCookie(): string | null {
    if (typeof window === 'undefined') return null;

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === STORAGE_KEYS.TOKEN) {
        return value || null;
      }
    }
    return null;
  }

  /**
   * Check if valid token cookie exists
   */
  private hasValidCookie(): boolean {
    return !!this.getTokenFromCookie();
  }

  /**
   * Update authentication state and notify listeners
   */
  private updateState(newState: Partial<AuthState>): void {
    const oldState = { ...this.state };
    this.state = {
      ...this.state,
      ...newState,
      lastUpdated: Date.now()
    };

    // Debug logging
    authStateDebugger.log('info', 'auth_state_update', {
      oldState: { 
        isAuthenticated: oldState.isAuthenticated, 
        userId: oldState.user?.userId,
        hasToken: !!oldState.token
      },
      newState: { 
        isAuthenticated: this.state.isAuthenticated, 
        userId: this.state.user?.userId,
        hasToken: !!this.state.token
      },
      changes: Object.keys(newState)
    });

    // Save to storage if authenticated
    if (this.state.isAuthenticated) {
      this.saveToStorage();
    } else if (oldState.isAuthenticated && !this.state.isAuthenticated) {
      // Clear storage on logout
      this.clearStorage();
    }

    // Log significant state changes
    if (oldState.isAuthenticated !== this.state.isAuthenticated) {
      logWithTimestamp('Auth state changed:', {
        from: { isAuthenticated: oldState.isAuthenticated, userId: oldState.user?.userId },
        to: { isAuthenticated: this.state.isAuthenticated, userId: this.state.user?.userId }
      });
      
      // Take debug snapshot on major state changes
      authStateDebugger.takeSnapshot();
    }

    // Notify listeners
    this.notifyListeners();

    // Emit cross-tab event
    this.emitAuthEvent(AUTH_EVENTS.STATE_CHANGED);
    
    // Broadcast to other tabs via sync manager
    if (this.isInitialized) {
      authSyncManager.broadcastAuthChange(
        this.state.isAuthenticated,
        this.state.user?.userId || null,
        this.state.sessionId
      );
    }
  }

  /**
   * Notify all state listeners
   */
  private notifyListeners(): void {
    const currentState = { ...this.state };
    this.listeners.forEach(listener => {
      try {
        listener(currentState);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Emit authentication event for cross-tab communication
   */
  private emitAuthEvent(eventType: string, data?: any): void {
    if (typeof window === 'undefined') return;

    const event = new CustomEvent(eventType, {
      detail: {
        timestamp: Date.now(),
        sessionId: this.state.sessionId,
        data
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Handle storage changes from other tabs
   */
  private handleStorageChange(event: StorageEvent): void {
    if (!event.key || !Object.values(STORAGE_KEYS).includes(event.key as any)) {
      return;
    }

    logWithTimestamp('Storage change detected:', { key: event.key, newValue: !!event.newValue });

    // Reload state from storage
    this.loadFromStorage();
  }

  /**
   * Handle custom authentication events
   */
  private handleAuthEvent(event: CustomEvent): void {
    const { detail } = event;
    
    // Ignore events from the same session
    if (detail?.sessionId === this.state.sessionId) {
      return;
    }

    logWithTimestamp('Auth event received:', { type: event.type, detail });

    // Reload state to sync with other tabs
    this.loadFromStorage();
  }

  /**
   * Handle page visibility changes
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible' && this.state.isAuthenticated) {
      // Refresh auth state when page becomes visible
      this.refreshAuth();
    }
  }

  /**
   * Handle online/offline status changes
   */
  private handleOnlineStatusChange(): void {
    if (navigator.onLine && this.state.isAuthenticated) {
      // Refresh auth state when coming back online
      setTimeout(() => this.refreshAuth(), 1000);
    }
  }

  /**
   * Set up periodic synchronization
   */
  private setupPeriodicSync(): void {
    // Sync every 5 minutes
    this.syncTimer = setInterval(() => {
      if (this.state.isAuthenticated && navigator.onLine) {
        this.refreshAuth();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up timers and event listeners
   */
  private cleanup(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange.bind(this));
      window.removeEventListener(AUTH_EVENTS.STATE_CHANGED, this.handleAuthEvent.bind(this) as EventListener);
      window.removeEventListener(AUTH_EVENTS.LOGIN, this.handleAuthEvent.bind(this) as EventListener);
      window.removeEventListener(AUTH_EVENTS.LOGOUT, this.handleAuthEvent.bind(this) as EventListener);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      window.removeEventListener('online', this.handleOnlineStatusChange.bind(this));
      window.removeEventListener('offline', this.handleOnlineStatusChange.bind(this));
    }
  }

  // Public API methods

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return { ...this.state };
  }

  /**
   * Subscribe to authentication state changes
   */
  subscribe(callback: (state: AuthState) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current state
    callback({ ...this.state });
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    authStateDebugger.log('info', 'login_attempt', { email: credentials.email });
    this.updateState({ loading: true, error: null });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      const data = await response.json() as any;

      if (response.ok && data.success) {
        const sessionId = this.generateSessionId();
        
        authStateDebugger.log('info', 'login_success', { 
          userId: data.user?.userId,
          hasToken: !!data.token,
          sessionId
        });
        
        this.updateState({
          isAuthenticated: true,
          user: data.user,
          token: data.token,
          sessionId,
          loading: false,
          error: null
        });

        // Emit login event
        this.emitAuthEvent(AUTH_EVENTS.LOGIN, { user: data.user });

        // Refresh user points
        setTimeout(() => this.refreshAuth(), 100);

        return { success: true, user: data.user, token: data.token };
      } else {
        const error = authErrorHandler.handleAuthError(
          data.error || new Error('Login failed'),
          'login'
        );
        
        authStateDebugger.log('error', 'login_failed', { 
          error: error.code,
          message: error.message,
          response: data
        });
        
        this.updateState({ loading: false, error });
        return { success: false, error };
      }
    } catch (error) {
      const authError = authErrorHandler.handleAuthError(error, 'login');
      authStateDebugger.log('error', 'login_error', { error: authError });
      this.updateState({ loading: false, error: authError });
      return { success: false, error: authError };
    }
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(credentials: GoogleCredentials): Promise<AuthResult> {
    this.updateState({ loading: true, error: null });

    try {
      const response = await fetch('/api/auth/google/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      const data = await response.json() as any;

      if (response.ok && data.success) {
        const sessionId = this.generateSessionId();
        
        this.updateState({
          isAuthenticated: true,
          user: data.user,
          token: data.token,
          sessionId,
          loading: false,
          error: null
        });

        // Emit login event
        this.emitAuthEvent(AUTH_EVENTS.LOGIN, { user: data.user });

        // Refresh user points
        setTimeout(() => this.refreshAuth(), 100);

        return { success: true, user: data.user, token: data.token };
      } else {
        const error = authErrorHandler.handleAuthError(
          data.error || new Error('Google login failed'),
          'googleLogin'
        );
        
        this.updateState({ loading: false, error });
        return { success: false, error };
      }
    } catch (error) {
      const authError = authErrorHandler.handleAuthError(error, 'googleLogin');
      this.updateState({ loading: false, error: authError });
      return { success: false, error: authError };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    authStateDebugger.log('info', 'logout_attempt', { 
      wasAuthenticated: this.state.isAuthenticated,
      userId: this.state.user?.userId
    });
    
    this.updateState({ loading: true });

    try {
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
      authStateDebugger.log('error', 'logout_api_error', error);
    }

    // Clear state regardless of API result
    this.updateState({
      isAuthenticated: false,
      user: null,
      token: null,
      userPoints: null,
      sessionId: null,
      loading: false,
      error: null
    });

    // Emit logout event
    this.emitAuthEvent(AUTH_EVENTS.LOGOUT);
    
    // Broadcast logout to all tabs
    authSyncManager.broadcastLogoutAll();

    authStateDebugger.log('info', 'logout_complete', {});
    logWithTimestamp('User logged out');
  }

  /**
   * Refresh authentication state from server
   */
  async refreshAuth(): Promise<void> {
    if (this.apiCallInProgress) {
      return;
    }

    this.apiCallInProgress = true;

    try {
      const response = await fetch('/api/getRemainingGenerations', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json() as any;
        
        if (data.isLoggedIn) {
          // Update user points and maintain current state
          this.updateState({
            userPoints: data.userPoints || 0,
            loading: false,
            error: null
          });
        } else if (this.state.isAuthenticated) {
          // Server says not logged in, but we think we are - logout
          logWithTimestamp('Server auth mismatch detected, logging out');
          await this.logout();
        }
      } else if (response.status === 401) {
        // Unauthorized - logout
        await this.logout();
      }
    } catch (error) {
      console.error('Error refreshing auth state:', error);
      // Don't update state on network errors to avoid unnecessary logouts
    } finally {
      this.apiCallInProgress = false;
    }
  }

  /**
   * Check if authentication state is stale and needs refresh
   */
  shouldRefresh(): boolean {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return (now - this.state.lastUpdated) > fiveMinutes;
  }

  /**
   * Force refresh if state is stale
   */
  async refreshIfStale(): Promise<void> {
    if (this.shouldRefresh() && this.state.isAuthenticated) {
      await this.refreshAuth();
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current state for debugging (used by authStateDebugger)
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Set state for debugging (used by authStateDebugger for auto-fix)
   */
  setState(newState: Partial<AuthState>): void {
    if (process.env.NODE_ENV === 'development') {
      authStateDebugger.log('info', 'debug_state_override', { newState });
      this.updateState(newState);
    }
  }

  /**
   * Set token for debugging (used by authStateDebugger for auto-fix)
   */
  setToken(token: string): void {
    if (process.env.NODE_ENV === 'development') {
      authStateDebugger.log('info', 'debug_token_override', { hasToken: !!token });
      this.updateState({ token });
    }
  }

  /**
   * Clear auth for debugging (used by authStateDebugger for auto-fix)
   */
  clearAuth(): void {
    if (process.env.NODE_ENV === 'development') {
      authStateDebugger.log('info', 'debug_clear_auth', {});
      this.updateState({
        isAuthenticated: false,
        user: null,
        token: null,
        userPoints: null,
        sessionId: null,
        error: null
      });
    }
  }

  /**
   * Get debug information (development only)
   */
  getDebugInfo(): any {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    return {
      state: this.state,
      listeners: this.listeners.size,
      apiCallInProgress: this.apiCallInProgress,
      isInitialized: this.isInitialized,
      hasValidCookie: this.hasValidCookie(),
      storageData: {
        user: localStorage.getItem(STORAGE_KEYS.USER),
        sessionId: localStorage.getItem(STORAGE_KEYS.SESSION_ID),
        lastSync: localStorage.getItem(STORAGE_KEYS.LAST_SYNC)
      }
    };
  }

  /**
   * Destroy the manager and clean up resources
   */
  destroy(): void {
    this.cleanup();
    this.listeners.clear();
    
    // Clean up sync manager
    if (typeof window !== 'undefined') {
      authSyncManager.destroy();
    }
  }
}

// Create and export singleton instance
export const unifiedAuthManager = new UnifiedAuthManager();

// Export for development debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).unifiedAuthManager = unifiedAuthManager;
}