/**
 * Authentication State Debugger
 * 认证状态调试工具
 * 
 * Provides debugging tools for authentication state management
 * in development environment
 */

export interface AuthStateSnapshot {
  timestamp: number;
  localStorage: {
    token?: string | null;
    user?: string | null;
    authState?: string | null;
  };
  cookies: {
    token?: string | null;
    user?: string | null;
  };
  sessionStorage: {
    authDebug?: string | null;
  };
  manager: {
    isAuthenticated: boolean;
    user: any;
    token: string | null;
    loading: boolean;
    error: string | null;
  };
}

export interface AuthStateInconsistency {
  type: 'token_mismatch' | 'user_mismatch' | 'state_mismatch' | 'missing_data' | 'storage_corruption';
  description: string;
  expected: any;
  actual: any;
  severity: 'low' | 'medium' | 'high';
  autoFixable: boolean;
}

export interface AuthDebugLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  action: string;
  data: any;
  stackTrace?: string;
}

class AuthStateDebugger {
  private logs: AuthDebugLog[] = [];
  private snapshots: AuthStateSnapshot[] = [];
  private isEnabled: boolean = false;
  private maxLogs: number = 100;
  private maxSnapshots: number = 20;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
    if (this.isEnabled && typeof window !== 'undefined') {
      this.initializeDebugger();
    }
  }

  private initializeDebugger(): void {
    // Add global debug methods
    if (typeof window !== 'undefined') {
      (window as any).__authDebugger = this;
      
      // Listen for storage events
      window.addEventListener('storage', (e) => {
        if (e.key?.startsWith('auth') || e.key === 'token' || e.key === 'user') {
          this.log('info', 'storage_change', {
            key: e.key,
            oldValue: e.oldValue,
            newValue: e.newValue
          });
          this.takeSnapshot();
        }
      });
    }
  }

  /**
   * Log authentication debug information
   */
  log(level: AuthDebugLog['level'], action: string, data: any): void {
    if (!this.isEnabled) return;

    const logEntry: AuthDebugLog = {
      timestamp: Date.now(),
      level,
      action,
      data,
      stackTrace: level === 'error' ? new Error().stack : undefined
    };

    this.logs.push(logEntry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with styling
    const style = this.getLogStyle(level);
    console.log(
      `%c[AuthDebug:${level.toUpperCase()}] ${action}`,
      style,
      data
    );
  }

  private getLogStyle(level: string): string {
    const styles = {
      info: 'color: #2196F3; font-weight: bold;',
      warn: 'color: #FF9800; font-weight: bold;',
      error: 'color: #F44336; font-weight: bold;',
      debug: 'color: #4CAF50; font-weight: bold;'
    };
    return styles[level as keyof typeof styles] || styles.info;
  }

  /**
   * Take a snapshot of current authentication state
   */
  takeSnapshot(): AuthStateSnapshot {
    if (!this.isEnabled || typeof window === 'undefined') {
      return {} as AuthStateSnapshot;
    }

    const snapshot: AuthStateSnapshot = {
      timestamp: Date.now(),
      localStorage: {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user'),
        authState: localStorage.getItem('authState')
      },
      cookies: {
        token: this.getCookie('token'),
        user: this.getCookie('user')
      },
      sessionStorage: {
        authDebug: sessionStorage.getItem('authDebug')
      },
      manager: {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      }
    };

    // Try to get manager state if available
    try {
      const managerState = (window as any).__authManager?.getState?.();
      if (managerState) {
        snapshot.manager = managerState;
      }
    } catch (error) {
      this.log('warn', 'snapshot_manager_error', error);
    }

    this.snapshots.push(snapshot);
    
    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    this.log('debug', 'snapshot_taken', snapshot);
    return snapshot;
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  /**
   * Check for authentication state inconsistencies
   */
  checkConsistency(): AuthStateInconsistency[] {
    if (!this.isEnabled) return [];

    const snapshot = this.takeSnapshot();
    const inconsistencies: AuthStateInconsistency[] = [];

    // Check token consistency
    const tokens = [
      snapshot.localStorage.token,
      snapshot.cookies.token,
      snapshot.manager.token
    ].filter(t => t !== null && t !== undefined);

    if (tokens.length > 1 && !tokens.every(t => t === tokens[0])) {
      inconsistencies.push({
        type: 'token_mismatch',
        description: 'Token values are inconsistent across storage locations',
        expected: tokens[0],
        actual: { localStorage: snapshot.localStorage.token, cookies: snapshot.cookies.token, manager: snapshot.manager.token },
        severity: 'high',
        autoFixable: true
      });
    }

    // Check user data consistency
    let userDataLS = null;
    let userDataCookie = null;
    
    try {
      userDataLS = snapshot.localStorage.user ? JSON.parse(snapshot.localStorage.user) : null;
    } catch (error) {
      inconsistencies.push({
        type: 'storage_corruption' as any,
        description: 'localStorage user data is corrupted (invalid JSON)',
        expected: 'valid JSON',
        actual: snapshot.localStorage.user,
        severity: 'high',
        autoFixable: true
      });
    }
    
    try {
      userDataCookie = snapshot.cookies.user ? JSON.parse(snapshot.cookies.user) : null;
    } catch (error) {
      inconsistencies.push({
        type: 'storage_corruption' as any,
        description: 'Cookie user data is corrupted (invalid JSON)',
        expected: 'valid JSON',
        actual: snapshot.cookies.user,
        severity: 'medium',
        autoFixable: true
      });
    }
    
    const userDataManager = snapshot.manager.user;

    if (userDataLS && userDataManager && JSON.stringify(userDataLS) !== JSON.stringify(userDataManager)) {
      inconsistencies.push({
        type: 'user_mismatch',
        description: 'User data is inconsistent between localStorage and manager',
        expected: userDataLS,
        actual: userDataManager,
        severity: 'medium',
        autoFixable: true
      });
    }

    // Check authentication state logic
    const hasToken = snapshot.manager.token !== null;
    const isAuthenticated = snapshot.manager.isAuthenticated;

    if (hasToken !== isAuthenticated) {
      inconsistencies.push({
        type: 'state_mismatch',
        description: 'Authentication state does not match token presence',
        expected: hasToken,
        actual: isAuthenticated,
        severity: 'high',
        autoFixable: true
      });
    }

    this.log('info', 'consistency_check', { inconsistencies });
    return inconsistencies;
  }

  /**
   * Attempt to automatically fix authentication state inconsistencies
   */
  async autoFix(): Promise<{ fixed: number; errors: string[] }> {
    if (!this.isEnabled) return { fixed: 0, errors: ['Debug mode not enabled'] };

    const inconsistencies = this.checkConsistency();
    const fixableIssues = inconsistencies.filter(i => i.autoFixable);
    let fixed = 0;
    const errors: string[] = [];

    this.log('info', 'auto_fix_start', { issues: fixableIssues.length });

    for (const issue of fixableIssues) {
      try {
        switch (issue.type) {
          case 'token_mismatch':
            await this.fixTokenMismatch();
            fixed++;
            break;
          case 'user_mismatch':
            await this.fixUserMismatch();
            fixed++;
            break;
          case 'state_mismatch':
            await this.fixStateMismatch();
            fixed++;
            break;
          case 'storage_corruption':
            await this.fixStorageCorruption();
            fixed++;
            break;
          default:
            errors.push(`Unknown issue type: ${issue.type}`);
        }
      } catch (error) {
        errors.push(`Failed to fix ${issue.type}: ${error}`);
        this.log('error', 'auto_fix_error', { issue: issue.type, error });
      }
    }

    this.log('info', 'auto_fix_complete', { fixed, errors });
    return { fixed, errors };
  }

  private async fixTokenMismatch(): Promise<void> {
    // Get the most recent valid token
    const snapshot = this.takeSnapshot();
    const validToken = snapshot.manager.token || snapshot.localStorage.token || snapshot.cookies.token;

    if (validToken) {
      // Sync all storage locations
      localStorage.setItem('token', validToken);
      document.cookie = `token=${validToken}; path=/; max-age=86400`;
      
      // Notify manager if available
      if ((window as any).__authManager?.setToken) {
        (window as any).__authManager.setToken(validToken);
      }
    } else {
      // Clear all if no valid token
      localStorage.removeItem('token');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      if ((window as any).__authManager?.clearAuth) {
        (window as any).__authManager.clearAuth();
      }
    }
  }

  private async fixUserMismatch(): Promise<void> {
    const snapshot = this.takeSnapshot();
    const validUser = snapshot.manager.user || 
                     (snapshot.localStorage.user ? JSON.parse(snapshot.localStorage.user) : null);

    if (validUser) {
      localStorage.setItem('user', JSON.stringify(validUser));
      document.cookie = `user=${encodeURIComponent(JSON.stringify(validUser))}; path=/; max-age=86400`;
    } else {
      localStorage.removeItem('user');
      document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  private async fixStateMismatch(): Promise<void> {
    const snapshot = this.takeSnapshot();
    const hasValidToken = snapshot.manager.token !== null && snapshot.manager.token !== '';

    if ((window as any).__authManager?.setState) {
      (window as any).__authManager.setState({
        isAuthenticated: hasValidToken,
        loading: false
      });
    }
  }

  private async fixStorageCorruption(): Promise<void> {
    // Clear corrupted data and try to restore from valid sources
    const snapshot = this.takeSnapshot();
    
    // Check if localStorage user data is corrupted
    try {
      if (snapshot.localStorage.user) {
        JSON.parse(snapshot.localStorage.user);
      }
    } catch (error) {
      // Clear corrupted localStorage user data
      localStorage.removeItem('user');
      
      // Try to restore from manager if available
      if (snapshot.manager.user) {
        localStorage.setItem('user', JSON.stringify(snapshot.manager.user));
      }
    }
    
    // Check if cookie user data is corrupted
    try {
      if (snapshot.cookies.user) {
        JSON.parse(snapshot.cookies.user);
      }
    } catch (error) {
      // Clear corrupted cookie
      document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Try to restore from manager if available
      if (snapshot.manager.user) {
        document.cookie = `user=${encodeURIComponent(JSON.stringify(snapshot.manager.user))}; path=/; max-age=86400`;
      }
    }
  }

  /**
   * Get debug information for display
   */
  getDebugInfo(): {
    logs: AuthDebugLog[];
    snapshots: AuthStateSnapshot[];
    currentState: AuthStateSnapshot;
    inconsistencies: AuthStateInconsistency[];
  } {
    return {
      logs: this.logs,
      snapshots: this.snapshots,
      currentState: this.takeSnapshot(),
      inconsistencies: this.checkConsistency()
    };
  }

  /**
   * Clear all debug data
   */
  clearDebugData(): void {
    this.logs = [];
    this.snapshots = [];
    this.log('info', 'debug_data_cleared', {});
  }

  /**
   * Export debug data for analysis
   */
  exportDebugData(): string {
    const debugInfo = this.getDebugInfo();
    return JSON.stringify(debugInfo, null, 2);
  }

  /**
   * Simulate authentication scenarios for testing
   */
  simulateScenario(scenario: 'token_expired' | 'user_logout' | 'storage_corruption'): void {
    if (!this.isEnabled) return;

    this.log('info', 'simulate_scenario', { scenario });

    switch (scenario) {
      case 'token_expired':
        localStorage.setItem('token', 'expired_token_' + Date.now());
        break;
      case 'user_logout':
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        break;
      case 'storage_corruption':
        localStorage.setItem('user', 'invalid_json_data');
        break;
    }

    this.takeSnapshot();
  }
}

// Export singleton instance
export const authStateDebugger = new AuthStateDebugger();

// Export for testing
export { AuthStateDebugger };