/**
 * Storage Error Handler
 * Provides comprehensive error handling for localStorage operations
 * Implements Requirements 5.1, 5.2, 5.5
 */

import { logWithTimestamp } from './logUtils';

export enum StorageErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  PRIVATE_BROWSING = 'PRIVATE_BROWSING',
  CORRUPTED_DATA = 'CORRUPTED_DATA',
  PARSE_ERROR = 'PARSE_ERROR',
  ACCESS_DENIED = 'ACCESS_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface StorageError {
  type: StorageErrorType;
  message: string;
  userMessage: string;
  key?: string;
  originalError?: any;
  timestamp: number;
}

export interface StorageOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: StorageError;
}

/**
 * User-friendly error messages for different storage errors
 */
const USER_ERROR_MESSAGES: Record<StorageErrorType, string> = {
  [StorageErrorType.QUOTA_EXCEEDED]: 
    'Storage limit reached. Please clear some browser data and try again.',
  [StorageErrorType.PRIVATE_BROWSING]: 
    'Storage is not available in private browsing mode. Please use a regular browser window.',
  [StorageErrorType.CORRUPTED_DATA]: 
    'Stored data is corrupted. Your session will be reset.',
  [StorageErrorType.PARSE_ERROR]: 
    'Unable to read stored data. Your session will be reset.',
  [StorageErrorType.ACCESS_DENIED]: 
    'Unable to access browser storage. Please check your browser settings.',
  [StorageErrorType.UNKNOWN_ERROR]: 
    'An unexpected storage error occurred. Please try again.'
};

/**
 * Storage Error Handler Class
 * Provides safe localStorage operations with comprehensive error handling
 */
export class StorageErrorHandler {
  private errorLog: StorageError[] = [];
  private maxLogSize: number = 50;

  /**
   * Safely get item from localStorage
   * Requirement 5.1: Handle corrupted localStorage data
   * Requirement 5.5: Add detailed error logging
   */
  getItem(key: string): StorageOperationResult<string | null> {
    try {
      // Check if localStorage is available
      if (!this.isStorageAvailable()) {
        return this.createError(
          StorageErrorType.PRIVATE_BROWSING,
          'localStorage is not available',
          key
        );
      }

      const value = localStorage.getItem(key);
      
      logWithTimestamp(`[Storage] Successfully read key: ${key}`, {
        hasValue: !!value,
        valueLength: value?.length || 0
      });

      return {
        success: true,
        data: value
      };
    } catch (error: any) {
      const storageError = this.handleStorageError(error, 'getItem', key);
      this.logError(storageError);
      return {
        success: false,
        error: storageError
      };
    }
  }

  /**
   * Safely set item in localStorage
   * Requirement 5.1: Handle localStorage quota exceeded errors
   * Requirement 5.5: Add detailed error logging
   */
  setItem(key: string, value: string): StorageOperationResult<void> {
    try {
      // Check if localStorage is available
      if (!this.isStorageAvailable()) {
        return this.createError(
          StorageErrorType.PRIVATE_BROWSING,
          'localStorage is not available',
          key
        );
      }

      // Check available space before writing
      const estimatedSize = new Blob([value]).size;
      logWithTimestamp(`[Storage] Attempting to write key: ${key}`, {
        estimatedSize,
        estimatedSizeKB: (estimatedSize / 1024).toFixed(2)
      });

      localStorage.setItem(key, value);
      
      logWithTimestamp(`[Storage] Successfully wrote key: ${key}`);

      return {
        success: true
      };
    } catch (error: any) {
      const storageError = this.handleStorageError(error, 'setItem', key);
      this.logError(storageError);
      
      // If quota exceeded, try to clear old data and retry once
      if (storageError.type === StorageErrorType.QUOTA_EXCEEDED) {
        logWithTimestamp('[Storage] Quota exceeded, attempting to clear old data');
        this.clearOldData();
        
        try {
          localStorage.setItem(key, value);
          logWithTimestamp(`[Storage] Retry successful for key: ${key}`);
          return { success: true };
        } catch (retryError: any) {
          const retryStorageError = this.handleStorageError(retryError, 'setItem (retry)', key);
          this.logError(retryStorageError);
          return {
            success: false,
            error: retryStorageError
          };
        }
      }

      return {
        success: false,
        error: storageError
      };
    }
  }

  /**
   * Safely remove item from localStorage
   */
  removeItem(key: string): StorageOperationResult<void> {
    try {
      if (!this.isStorageAvailable()) {
        return this.createError(
          StorageErrorType.PRIVATE_BROWSING,
          'localStorage is not available',
          key
        );
      }

      localStorage.removeItem(key);
      logWithTimestamp(`[Storage] Successfully removed key: ${key}`);

      return {
        success: true
      };
    } catch (error: any) {
      const storageError = this.handleStorageError(error, 'removeItem', key);
      this.logError(storageError);
      return {
        success: false,
        error: storageError
      };
    }
  }

  /**
   * Safely parse JSON from localStorage
   * Requirement 5.1: Handle corrupted localStorage data
   * Requirement 5.5: Add detailed error logging
   */
  getJSON<T = any>(key: string): StorageOperationResult<T | null> {
    const result = this.getItem(key);
    
    if (!result.success) {
      return result as StorageOperationResult<T | null>;
    }

    // If data is null or undefined, return success with null data
    if (result.data === null || result.data === undefined) {
      return {
        success: true,
        data: null
      };
    }

    // Empty string is considered corrupted data for JSON
    if (result.data === '') {
      const storageError: StorageError = {
        type: StorageErrorType.PARSE_ERROR,
        message: `Empty string found for key: ${key}`,
        userMessage: USER_ERROR_MESSAGES[StorageErrorType.PARSE_ERROR],
        key,
        timestamp: Date.now()
      };
      
      logWithTimestamp(`[Storage] Empty string found for key: ${key}`);
      this.logError(storageError);
      
      return {
        success: false,
        error: storageError
      };
    }

    try {
      const parsed = JSON.parse(result.data);
      logWithTimestamp(`[Storage] Successfully parsed JSON for key: ${key}`);
      
      return {
        success: true,
        data: parsed
      };
    } catch (error: any) {
      const storageError: StorageError = {
        type: StorageErrorType.PARSE_ERROR,
        message: `Failed to parse JSON for key: ${key}`,
        userMessage: USER_ERROR_MESSAGES[StorageErrorType.PARSE_ERROR],
        key,
        originalError: error,
        timestamp: Date.now()
      };
      
      logWithTimestamp(`[Storage] JSON parse error for key: ${key}`, {
        error: error.message,
        dataPreview: result.data?.substring(0, 100)
      });
      
      this.logError(storageError);
      
      return {
        success: false,
        error: storageError
      };
    }
  }

  /**
   * Safely set JSON in localStorage
   */
  setJSON(key: string, value: any): StorageOperationResult<void> {
    try {
      const jsonString = JSON.stringify(value);
      return this.setItem(key, jsonString);
    } catch (error: any) {
      const storageError: StorageError = {
        type: StorageErrorType.UNKNOWN_ERROR,
        message: `Failed to stringify JSON for key: ${key}`,
        userMessage: USER_ERROR_MESSAGES[StorageErrorType.UNKNOWN_ERROR],
        key,
        originalError: error,
        timestamp: Date.now()
      };
      
      logWithTimestamp(`[Storage] JSON stringify error for key: ${key}`, error);
      this.logError(storageError);
      
      return {
        success: false,
        error: storageError
      };
    }
  }

  /**
   * Check if localStorage is available
   * Requirement 5.1: Handle private browsing mode errors
   */
  isStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      // Test if we can actually write to localStorage
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      logWithTimestamp('[Storage] localStorage is not available', error);
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): {
    available: boolean;
    estimatedUsage?: number;
    estimatedQuota?: number;
    usagePercentage?: number;
  } {
    if (!this.isStorageAvailable()) {
      return { available: false };
    }

    try {
      // Estimate current usage using localStorage API
      let totalSize = 0;
      const length = localStorage.length;
      
      for (let i = 0; i < length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length + key.length;
          }
        }
      }

      // Most browsers have a 5-10MB limit for localStorage
      const estimatedQuota = 5 * 1024 * 1024; // 5MB
      const usagePercentage = (totalSize / estimatedQuota) * 100;

      logWithTimestamp('[Storage] Storage info:', {
        totalSize,
        totalSizeKB: (totalSize / 1024).toFixed(2),
        estimatedQuota,
        usagePercentage: usagePercentage.toFixed(2)
      });

      return {
        available: true,
        estimatedUsage: totalSize,
        estimatedQuota,
        usagePercentage
      };
    } catch (error) {
      logWithTimestamp('[Storage] Failed to get storage info', error);
      return { available: true };
    }
  }

  /**
   * Clear old or unnecessary data to free up space
   */
  private clearOldData(): void {
    try {
      // List of keys that are safe to remove (non-critical data)
      const nonCriticalKeys = [
        'auth_last_sync',
        'debug_logs',
        'temp_data',
        'cache_'
      ];

      for (const key of nonCriticalKeys) {
        if (key.endsWith('_')) {
          // Remove all keys starting with this prefix
          for (let storageKey in localStorage) {
            if (storageKey.startsWith(key)) {
              localStorage.removeItem(storageKey);
              logWithTimestamp(`[Storage] Cleared old data: ${storageKey}`);
            }
          }
        } else {
          localStorage.removeItem(key);
          logWithTimestamp(`[Storage] Cleared old data: ${key}`);
        }
      }
    } catch (error) {
      logWithTimestamp('[Storage] Failed to clear old data', error);
    }
  }

  /**
   * Handle storage errors and categorize them
   * Requirement 5.5: Add detailed error logging for debugging
   */
  private handleStorageError(error: any, operation: string, key?: string): StorageError {
    let errorType: StorageErrorType;
    let message: string;

    // Categorize error based on error message and code
    if (error.name === 'QuotaExceededError' || 
        error.code === 22 || 
        error.code === 1014 ||
        error.message?.includes('quota')) {
      errorType = StorageErrorType.QUOTA_EXCEEDED;
      message = `Storage quota exceeded during ${operation}`;
    } else if (error.message?.includes('private') || 
               error.message?.includes('incognito')) {
      errorType = StorageErrorType.PRIVATE_BROWSING;
      message = `Storage not available in private browsing mode during ${operation}`;
    } else if (error.name === 'SecurityError' || 
               error.message?.includes('security') ||
               error.message?.includes('access denied')) {
      errorType = StorageErrorType.ACCESS_DENIED;
      message = `Storage access denied during ${operation}`;
    } else {
      errorType = StorageErrorType.UNKNOWN_ERROR;
      message = `Unknown storage error during ${operation}: ${error.message}`;
    }

    const storageError: StorageError = {
      type: errorType,
      message,
      userMessage: USER_ERROR_MESSAGES[errorType],
      key,
      originalError: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      timestamp: Date.now()
    };

    return storageError;
  }

  /**
   * Create error result
   */
  private createError(
    type: StorageErrorType,
    message: string,
    key?: string
  ): StorageOperationResult {
    const error: StorageError = {
      type,
      message,
      userMessage: USER_ERROR_MESSAGES[type],
      key,
      timestamp: Date.now()
    };

    this.logError(error);

    return {
      success: false,
      error
    };
  }

  /**
   * Log error to internal error log
   * Requirement 5.5: Add detailed error logging for debugging
   */
  private logError(error: StorageError): void {
    // Add to error log
    this.errorLog.push(error);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console with full details
    console.error('[Storage Error]', {
      type: error.type,
      message: error.message,
      key: error.key,
      timestamp: new Date(error.timestamp).toISOString(),
      originalError: error.originalError
    });

    // Log with timestamp utility
    logWithTimestamp('[Storage Error]', {
      type: error.type,
      message: error.message,
      userMessage: error.userMessage,
      key: error.key
    });
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(count: number = 10): StorageError[] {
    return this.errorLog.slice(-count);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
    logWithTimestamp('[Storage] Error log cleared');
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<StorageErrorType, number> {
    const stats: Record<StorageErrorType, number> = {
      [StorageErrorType.QUOTA_EXCEEDED]: 0,
      [StorageErrorType.PRIVATE_BROWSING]: 0,
      [StorageErrorType.CORRUPTED_DATA]: 0,
      [StorageErrorType.PARSE_ERROR]: 0,
      [StorageErrorType.ACCESS_DENIED]: 0,
      [StorageErrorType.UNKNOWN_ERROR]: 0
    };

    for (const error of this.errorLog) {
      stats[error.type]++;
    }

    return stats;
  }
}

// Export singleton instance
export const storageErrorHandler = new StorageErrorHandler();
