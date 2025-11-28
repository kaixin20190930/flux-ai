/**
 * Tests for AuthStateDebugger
 */

import { AuthStateDebugger, authStateDebugger } from '../authStateDebugger';

// Mock window and localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const mockDocument = {
  cookie: '',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const mockWindow = {
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: { protocol: 'https:' },
  navigator: { onLine: true },
};

// Mock global objects
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(global, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Mock process.env
const originalEnv = process.env;

describe('AuthStateDebugger', () => {
  let debugger: AuthStateDebugger;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set development environment
    process.env = { ...originalEnv, NODE_ENV: 'development' };
    
    // Reset document.cookie
    mockDocument.cookie = '';
    
    // Create new debugger instance
    debugger = new AuthStateDebugger();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Initialization', () => {
    it('should initialize in development environment', () => {
      expect(debugger).toBeDefined();
      expect((window as any).__authDebugger).toBe(debugger);
    });

    it('should not initialize in production environment', () => {
      process.env.NODE_ENV = 'production';
      const prodDebugger = new AuthStateDebugger();
      expect((window as any).__authDebugger).toBe(debugger); // Still the old one
    });
  });

  describe('Logging', () => {
    it('should log debug information in development', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      debugger.log('info', 'test_action', { test: 'data' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AuthDebug:INFO] test_action'),
        expect.any(String),
        { test: 'data' }
      );
      
      consoleSpy.mockRestore();
    });

    it('should not log in production environment', () => {
      process.env.NODE_ENV = 'production';
      const prodDebugger = new AuthStateDebugger();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      prodDebugger.log('info', 'test_action', { test: 'data' });
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should maintain log history', () => {
      debugger.log('info', 'action1', { data: 1 });
      debugger.log('warn', 'action2', { data: 2 });
      debugger.log('error', 'action3', { data: 3 });
      
      const debugInfo = debugger.getDebugInfo();
      expect(debugInfo.logs).toHaveLength(3);
      expect(debugInfo.logs[0].action).toBe('action1');
      expect(debugInfo.logs[1].level).toBe('warn');
      expect(debugInfo.logs[2].data).toEqual({ data: 3 });
    });
  });

  describe('Snapshots', () => {
    beforeEach(() => {
      // Mock localStorage data
      mockLocalStorage.getItem.mockImplementation((key) => {
        const data = {
          'token': 'test-token',
          'user': JSON.stringify({ id: 1, name: 'Test User' }),
          'authState': JSON.stringify({ isAuthenticated: true })
        };
        return data[key as keyof typeof data] || null;
      });

      // Mock document.cookie
      mockDocument.cookie = 'token=test-token; user=test-user';
    });

    it('should take snapshots of authentication state', () => {
      const snapshot = debugger.takeSnapshot();
      
      expect(snapshot).toMatchObject({
        timestamp: expect.any(Number),
        localStorage: {
          token: 'test-token',
          user: expect.any(String),
          authState: expect.any(String)
        },
        cookies: expect.any(Object),
        sessionStorage: expect.any(Object),
        manager: expect.any(Object)
      });
    });

    it('should maintain snapshot history', () => {
      debugger.takeSnapshot();
      debugger.takeSnapshot();
      debugger.takeSnapshot();
      
      const debugInfo = debugger.getDebugInfo();
      expect(debugInfo.snapshots).toHaveLength(3);
    });
  });

  describe('Consistency Checking', () => {
    it('should detect token mismatches', () => {
      // Mock inconsistent token data
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'local-token';
        return null;
      });
      
      mockDocument.cookie = 'token=cookie-token';
      
      // Mock auth manager with different token
      (window as any).__authManager = {
        getState: () => ({ token: 'manager-token', isAuthenticated: true, user: null })
      };
      
      const inconsistencies = debugger.checkConsistency();
      
      expect(inconsistencies).toHaveLength(1);
      expect(inconsistencies[0].type).toBe('token_mismatch');
      expect(inconsistencies[0].severity).toBe('high');
      expect(inconsistencies[0].autoFixable).toBe(true);
    });

    it('should detect authentication state mismatches', () => {
      // Mock auth manager with inconsistent state
      (window as any).__authManager = {
        getState: () => ({ 
          token: 'valid-token', 
          isAuthenticated: false, // Inconsistent!
          user: null 
        })
      };
      
      const inconsistencies = debugger.checkConsistency();
      
      expect(inconsistencies.some(i => i.type === 'state_mismatch')).toBe(true);
    });

    it('should return no inconsistencies for consistent state', () => {
      // Mock consistent state
      const consistentToken = 'consistent-token';
      const consistentUser = { id: 1, name: 'Test User' };
      
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return consistentToken;
        if (key === 'user') return JSON.stringify(consistentUser);
        return null;
      });
      
      mockDocument.cookie = `token=${consistentToken}`;
      
      (window as any).__authManager = {
        getState: () => ({ 
          token: consistentToken, 
          isAuthenticated: true, 
          user: consistentUser 
        })
      };
      
      const inconsistencies = debugger.checkConsistency();
      
      expect(inconsistencies).toHaveLength(0);
    });
  });

  describe('Auto-fix Functionality', () => {
    it('should fix token mismatches', async () => {
      // Mock inconsistent tokens
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'old-token';
        return null;
      });
      
      (window as any).__authManager = {
        getState: () => ({ 
          token: 'new-token', 
          isAuthenticated: true, 
          user: null 
        }),
        setToken: jest.fn()
      };
      
      const result = await debugger.autoFix();
      
      expect(result.fixed).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
    });

    it('should handle auto-fix errors gracefully', async () => {
      // Mock error during fix
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      (window as any).__authManager = {
        getState: () => ({ 
          token: 'token1', 
          isAuthenticated: false, 
          user: null 
        })
      };
      
      const result = await debugger.autoFix();
      
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Scenario Simulation', () => {
    it('should simulate token expiration', () => {
      debugger.simulateScenario('token_expired');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'token', 
        expect.stringContaining('expired_token_')
      );
    });

    it('should simulate user logout', () => {
      debugger.simulateScenario('user_logout');
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });

    it('should simulate storage corruption', () => {
      debugger.simulateScenario('storage_corruption');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', 'invalid_json_data');
    });
  });

  describe('Data Export', () => {
    it('should export debug data as JSON', () => {
      debugger.log('info', 'test', { data: 'test' });
      debugger.takeSnapshot();
      
      const exportedData = debugger.exportDebugData();
      const parsedData = JSON.parse(exportedData);
      
      expect(parsedData).toHaveProperty('logs');
      expect(parsedData).toHaveProperty('snapshots');
      expect(parsedData).toHaveProperty('currentState');
      expect(parsedData).toHaveProperty('inconsistencies');
    });
  });

  describe('Cleanup', () => {
    it('should clear debug data', () => {
      debugger.log('info', 'test', {});
      debugger.takeSnapshot();
      
      debugger.clearDebugData();
      
      const debugInfo = debugger.getDebugInfo();
      expect(debugInfo.logs).toHaveLength(1); // Only the clear log
      expect(debugInfo.snapshots).toHaveLength(0);
    });
  });
});