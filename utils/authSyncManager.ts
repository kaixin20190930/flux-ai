import { logWithTimestamp } from './logUtils';

/**
 * Cross-tab authentication synchronization manager
 * Handles synchronization of authentication state between multiple browser tabs
 */

// Storage keys for synchronization
const SYNC_KEYS = {
  AUTH_STATE: 'auth_sync_state',
  LAST_ACTIVITY: 'auth_last_activity',
  TAB_ID: 'auth_tab_id'
} as const;

// Events for cross-tab communication
const SYNC_EVENTS = {
  AUTH_CHANGED: 'auth_sync_changed',
  TAB_ACTIVE: 'auth_tab_active',
  LOGOUT_ALL: 'auth_logout_all'
} as const;

// Sync state interface
interface SyncState {
  isAuthenticated: boolean;
  userId: string | null;
  sessionId: string | null;
  timestamp: number;
  tabId: string;
}

export class AuthSyncManager {
  private tabId: string;
  private isActive: boolean = true;
  private syncTimer: NodeJS.Timeout | null = null;
  private listeners: Set<(state: SyncState) => void> = new Set();

  constructor() {
    this.tabId = this.generateTabId();
    
    if (typeof window !== 'undefined') {
      this.initializeBrowserFeatures();
    }
  }

  /**
   * Initialize browser-specific synchronization features
   */
  private initializeBrowserFeatures(): void {
    // Listen for storage changes from other tabs
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Listen for custom sync events
    window.addEventListener(SYNC_EVENTS.AUTH_CHANGED, this.handleSyncEvent.bind(this) as EventListener);
    window.addEventListener(SYNC_EVENTS.LOGOUT_ALL, this.handleLogoutAll.bind(this) as EventListener);
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Listen for beforeunload to clean up
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // Set up periodic activity updates
    this.setupActivityTracking();
    
    // Mark this tab as active
    this.markTabActive();
    
    logWithTimestamp('AuthSyncManager initialized for tab:', this.tabId);
  }

  /**
   * Generate unique tab ID
   */
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set up periodic activity tracking
   */
  private setupActivityTracking(): void {
    // Update activity every 30 seconds
    this.syncTimer = setInterval(() => {
      if (this.isActive) {
        this.markTabActive();
      }
    }, 30000);
  }

  /**
   * Mark current tab as active
   */
  private markTabActive(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(SYNC_KEYS.LAST_ACTIVITY, JSON.stringify({
        tabId: this.tabId,
        timestamp: Date.now(),
        isActive: this.isActive
      }));

      // Emit tab active event
      this.emitSyncEvent(SYNC_EVENTS.TAB_ACTIVE, { tabId: this.tabId });
    } catch (error) {
      console.error('Error marking tab as active:', error);
    }
  }

  /**
   * Handle storage changes from other tabs
   */
  private handleStorageChange(event: StorageEvent): void {
    if (!event.key || !Object.values(SYNC_KEYS).includes(event.key as any)) {
      return;
    }

    if (event.key === SYNC_KEYS.AUTH_STATE && event.newValue) {
      try {
        const syncState: SyncState = JSON.parse(event.newValue);
        
        // Ignore changes from the same tab
        if (syncState.tabId === this.tabId) {
          return;
        }

        logWithTimestamp('Auth state change detected from another tab:', syncState);
        this.notifyListeners(syncState);
      } catch (error) {
        console.error('Error parsing sync state:', error);
      }
    }
  }

  /**
   * Handle custom sync events
   */
  private handleSyncEvent(event: CustomEvent): void {
    const { detail } = event;
    
    // Ignore events from the same tab
    if (detail?.tabId === this.tabId) {
      return;
    }

    logWithTimestamp('Sync event received:', { type: event.type, detail });
  }

  /**
   * Handle logout all tabs event
   */
  private handleLogoutAll(event: CustomEvent): void {
    const { detail } = event;
    
    // Ignore events from the same tab
    if (detail?.tabId === this.tabId) {
      return;
    }

    logWithTimestamp('Logout all tabs event received');
    
    // Notify listeners about forced logout
    this.notifyListeners({
      isAuthenticated: false,
      userId: null,
      sessionId: null,
      timestamp: Date.now(),
      tabId: detail?.tabId || 'unknown'
    });
  }

  /**
   * Handle page visibility changes
   */
  private handleVisibilityChange(): void {
    this.isActive = document.visibilityState === 'visible';
    
    if (this.isActive) {
      this.markTabActive();
      logWithTimestamp('Tab became active:', this.tabId);
    } else {
      logWithTimestamp('Tab became inactive:', this.tabId);
    }
  }

  /**
   * Handle before unload to clean up
   */
  private handleBeforeUnload(): void {
    this.cleanup();
  }

  /**
   * Emit synchronization event
   */
  private emitSyncEvent(eventType: string, data?: any): void {
    if (typeof window === 'undefined') return;

    const event = new CustomEvent(eventType, {
      detail: {
        tabId: this.tabId,
        timestamp: Date.now(),
        ...data
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(state: SyncState): void {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange.bind(this));
      window.removeEventListener(SYNC_EVENTS.AUTH_CHANGED, this.handleSyncEvent.bind(this) as EventListener);
      window.removeEventListener(SYNC_EVENTS.LOGOUT_ALL, this.handleLogoutAll.bind(this) as EventListener);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }
  }

  // Public API methods

  /**
   * Subscribe to synchronization events
   */
  subscribe(callback: (state: SyncState) => void): () => void {
    this.listeners.add(callback);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Broadcast authentication state change to other tabs
   */
  broadcastAuthChange(isAuthenticated: boolean, userId: string | null, sessionId: string | null): void {
    if (typeof window === 'undefined') return;

    const syncState: SyncState = {
      isAuthenticated,
      userId,
      sessionId,
      timestamp: Date.now(),
      tabId: this.tabId
    };

    try {
      // Store in localStorage for other tabs to detect
      localStorage.setItem(SYNC_KEYS.AUTH_STATE, JSON.stringify(syncState));
      
      // Emit custom event
      this.emitSyncEvent(SYNC_EVENTS.AUTH_CHANGED, syncState);
      
      logWithTimestamp('Auth state broadcasted:', syncState);
    } catch (error) {
      console.error('Error broadcasting auth change:', error);
    }
  }

  /**
   * Broadcast logout to all tabs
   */
  broadcastLogoutAll(): void {
    if (typeof window === 'undefined') return;

    try {
      // Clear auth state
      localStorage.removeItem(SYNC_KEYS.AUTH_STATE);
      
      // Emit logout all event
      this.emitSyncEvent(SYNC_EVENTS.LOGOUT_ALL, { reason: 'user_logout' });
      
      logWithTimestamp('Logout all tabs broadcasted');
    } catch (error) {
      console.error('Error broadcasting logout all:', error);
    }
  }

  /**
   * Get current tab ID
   */
  getTabId(): string {
    return this.tabId;
  }

  /**
   * Check if current tab is active
   */
  isTabActive(): boolean {
    return this.isActive;
  }

  /**
   * Get last activity information
   */
  getLastActivity(): any {
    if (typeof window === 'undefined') return null;

    try {
      const activityData = localStorage.getItem(SYNC_KEYS.LAST_ACTIVITY);
      return activityData ? JSON.parse(activityData) : null;
    } catch (error) {
      console.error('Error getting last activity:', error);
      return null;
    }
  }

  /**
   * Force sync with other tabs
   */
  forceSync(): void {
    if (typeof window === 'undefined') return;

    try {
      const syncData = localStorage.getItem(SYNC_KEYS.AUTH_STATE);
      if (syncData) {
        const syncState: SyncState = JSON.parse(syncData);
        
        // Only sync if from a different tab
        if (syncState.tabId !== this.tabId) {
          this.notifyListeners(syncState);
        }
      }
    } catch (error) {
      console.error('Error forcing sync:', error);
    }
  }

  /**
   * Get debug information
   */
  getDebugInfo(): any {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    return {
      tabId: this.tabId,
      isActive: this.isActive,
      listeners: this.listeners.size,
      lastActivity: this.getLastActivity(),
      syncState: typeof window !== 'undefined' ? 
        localStorage.getItem(SYNC_KEYS.AUTH_STATE) : null
    };
  }

  /**
   * Destroy the sync manager
   */
  destroy(): void {
    this.cleanup();
    this.listeners.clear();
  }
}

// Create and export singleton instance
export const authSyncManager = new AuthSyncManager();

// Export for development debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).authSyncManager = authSyncManager;
}