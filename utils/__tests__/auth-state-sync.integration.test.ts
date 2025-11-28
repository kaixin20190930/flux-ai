/**
 * Authentication State Synchronization Integration Tests
 * 
 * Tests the synchronization of authentication state across multiple components,
 * tabs, and storage mechanisms to ensure consistent user experience.
 * 
 * Requirements covered:
 * - 3.3: 当认证状态不一致时，系统应该自动修复或提示用户重新登录
 * - 3.4: 当认证过程超时时，系统应该提供重试选项
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useEffect, useState } from 'react'
import { UnifiedAuthManager } from '../unifiedAuthManager'
import { AuthenticationService } from '../authenticationService'
import { UserRepository } from '../userRepository'
import { AuthErrorHandler } from '../authErrorHandler'
import { useUnifiedAuthManager } from '../../hooks/useUnifiedAuthManager'

// Mock dependencies
jest.mock('../userRepository')
jest.mock('../authErrorHandler')

// Test components for state synchronization
const AuthStateDisplay: React.FC<{ id: string }> = ({ id }) => {
  const { authState } = useUnifiedAuthManager()
  
  return (
    <div data-testid={`auth-display-${id}`}>
      <div data-testid={`status-${id}`}>
        {authState.isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid={`user-${id}`}>
        {authState.user?.name || 'no-user'}
      </div>
      <div data-testid={`loading-${id}`}>
        {authState.loading ? 'loading' : 'not-loading'}
      </div>
      <div data-testid={`error-${id}`}>
        {authState.error || 'no-error'}
      </div>
    </div>
  )
}

const AuthController: React.FC = () => {
  const { login, logout, refreshAuth } = useUnifiedAuthManager()
  
  return (
    <div>
      <button 
        data-testid="login-btn"
        onClick={() => login({ email: 'test@example.com', password: 'password123' })}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
      <button data-testid="refresh-btn" onClick={refreshAuth}>
        Refresh
      </button>
    </div>
  )
}

const MultiComponentApp: React.FC = () => {
  return (
    <div>
      <AuthController />
      <AuthStateDisplay id="1" />
      <AuthStateDisplay id="2" />
      <AuthStateDisplay id="3" />
    </div>
  )
}

// Component to simulate storage events from other tabs
const StorageEventSimulator: React.FC = () => {
  const [eventLog, setEventLog] = useState<string[]>([])

  const simulateLogin = () => {
    const mockUser = {
      id: '1',
      name: 'External Tab User',
      email: 'external@example.com',
      isGoogleUser: false,
      points: 50,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    localStorage.setItem('auth_token', 'external-token')
    localStorage.setItem('user_info', JSON.stringify(mockUser))
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'auth_token',
      newValue: 'external-token',
      oldValue: null,
      storageArea: localStorage
    }))

    setEventLog(prev => [...prev, 'login-simulated'])
  }

  const simulateLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'auth_token',
      newValue: null,
      oldValue: 'external-token',
      storageArea: localStorage
    }))

    setEventLog(prev => [...prev, 'logout-simulated'])
  }

  return (
    <div>
      <button data-testid="simulate-login" onClick={simulateLogin}>
        Simulate External Login
      </button>
      <button data-testid="simulate-logout" onClick={simulateLogout}>
        Simulate External Logout
      </button>
      <div data-testid="event-log">
        {eventLog.join(',')}
      </div>
    </div>
  )
}

describe('Authentication State Synchronization Integration Tests', () => {
  let mockUserRepository: jest.Mocked<UserRepository>
  let mockAuthErrorHandler: jest.Mocked<AuthErrorHandler>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>
    mockAuthErrorHandler = new AuthErrorHandler() as jest.Mocked<AuthErrorHandler>
    
    // Clear all storage
    localStorage.clear()
    sessionStorage.clear()
    document.cookie = ''
    
    // Setup default successful responses
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        token: 'test-token',
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          isGoogleUser: false,
          points: 50
        }
      })
    })
  })

  describe('Multi-Component State Synchronization', () => {
    it('should synchronize authentication state across multiple components', async () => {
      render(<MultiComponentApp />)

      // Initially all components should show not authenticated
      expect(screen.getByTestId('status-1')).toHaveTextContent('not-authenticated')
      expect(screen.getByTestId('status-2')).toHaveTextContent('not-authenticated')
      expect(screen.getByTestId('status-3')).toHaveTextContent('not-authenticated')

      // Login from controller
      await userEvent.click(screen.getByTestId('login-btn'))

      // All components should update to authenticated
      await waitFor(() => {
        expect(screen.getByTestId('status-1')).toHaveTextContent('authenticated')
        expect(screen.getByTestId('status-2')).toHaveTextContent('authenticated')
        expect(screen.getByTestId('status-3')).toHaveTextContent('authenticated')
      })

      // All components should show the same user
      expect(screen.getByTestId('user-1')).toHaveTextContent('Test User')
      expect(screen.getByTestId('user-2')).toHaveTextContent('Test User')
      expect(screen.getByTestId('user-3')).toHaveTextContent('Test User')
    })

    it('should synchronize logout across all components', async () => {
      // Setup authenticated state
      localStorage.setItem('auth_token', 'existing-token')
      localStorage.setItem('user_info', JSON.stringify({
        id: '1',
        name: 'Existing User',
        email: 'existing@example.com'
      }))

      render(<MultiComponentApp />)

      // Wait for initial state to load
      await waitFor(() => {
        expect(screen.getByTestId('status-1')).toHaveTextContent('authenticated')
      })

      // Logout
      await userEvent.click(screen.getByTestId('logout-btn'))

      // All components should update to not authenticated
      await waitFor(() => {
        expect(screen.getByTestId('status-1')).toHaveTextContent('not-authenticated')
        expect(screen.getByTestId('status-2')).toHaveTextContent('not-authenticated')
        expect(screen.getByTestId('status-3')).toHaveTextContent('not-authenticated')
      })

      // Storage should be cleared
      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(localStorage.getItem('user_info')).toBeNull()
    })

    it('should synchronize loading states during authentication', async () => {
      // Mock slow API response
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              success: true,
              token: 'slow-token',
              user: { id: '1', name: 'Slow User', email: 'slow@example.com' }
            })
          }), 100)
        )
      )

      render(<MultiComponentApp />)

      // Start login
      await userEvent.click(screen.getByTestId('login-btn'))

      // All components should show loading
      await waitFor(() => {
        expect(screen.getByTestId('loading-1')).toHaveTextContent('loading')
        expect(screen.getByTestId('loading-2')).toHaveTextContent('loading')
        expect(screen.getByTestId('loading-3')).toHaveTextContent('loading')
      })

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByTestId('loading-1')).toHaveTextContent('not-loading')
        expect(screen.getByTestId('loading-2')).toHaveTextContent('not-loading')
        expect(screen.getByTestId('loading-3')).toHaveTextContent('not-loading')
      }, { timeout: 200 })
    })

    it('should synchronize error states across components', async () => {
      // Mock API error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid credentials'
          }
        })
      })

      render(<MultiComponentApp />)

      // Attempt login
      await userEvent.click(screen.getByTestId('login-btn'))

      // All components should show the same error
      await waitFor(() => {
        expect(screen.getByTestId('error-1')).toHaveTextContent('Invalid credentials')
        expect(screen.getByTestId('error-2')).toHaveTextContent('Invalid credentials')
        expect(screen.getByTestId('error-3')).toHaveTextContent('Invalid credentials')
      })
    })
  })

  describe('Cross-Tab State Synchronization', () => {
    it('should sync login state from external tab', async () => {
      render(
        <div>
          <StorageEventSimulator />
          <AuthStateDisplay id="main" />
        </div>
      )

      // Initially not authenticated
      expect(screen.getByTestId('status-main')).toHaveTextContent('not-authenticated')

      // Simulate login from another tab
      await userEvent.click(screen.getByTestId('simulate-login'))

      // Should sync the login state
      await waitFor(() => {
        expect(screen.getByTestId('status-main')).toHaveTextContent('authenticated')
        expect(screen.getByTestId('user-main')).toHaveTextContent('External Tab User')
      })

      // Verify event was logged
      expect(screen.getByTestId('event-log')).toHaveTextContent('login-simulated')
    })

    it('should sync logout state from external tab', async () => {
      // Setup authenticated state
      localStorage.setItem('auth_token', 'tab-token')
      localStorage.setItem('user_info', JSON.stringify({
        id: '1',
        name: 'Tab User',
        email: 'tab@example.com'
      }))

      render(
        <div>
          <StorageEventSimulator />
          <AuthStateDisplay id="main" />
        </div>
      )

      // Initially authenticated
      await waitFor(() => {
        expect(screen.getByTestId('status-main')).toHaveTextContent('authenticated')
      })

      // Simulate logout from another tab
      await userEvent.click(screen.getByTestId('simulate-logout'))

      // Should sync the logout state
      await waitFor(() => {
        expect(screen.getByTestId('status-main')).toHaveTextContent('not-authenticated')
        expect(screen.getByTestId('user-main')).toHaveTextContent('no-user')
      })
    })

    it('should handle rapid cross-tab state changes', async () => {
      render(
        <div>
          <StorageEventSimulator />
          <AuthStateDisplay id="main" />
        </div>
      )

      const simulateLoginBtn = screen.getByTestId('simulate-login')
      const simulateLogoutBtn = screen.getByTestId('simulate-logout')

      // Rapid login/logout cycles
      for (let i = 0; i < 5; i++) {
        await userEvent.click(simulateLoginBtn)
        await waitFor(() => {
          expect(screen.getByTestId('status-main')).toHaveTextContent('authenticated')
        })

        await userEvent.click(simulateLogoutBtn)
        await waitFor(() => {
          expect(screen.getByTestId('status-main')).toHaveTextContent('not-authenticated')
        })
      }

      // Final state should be consistent
      expect(screen.getByTestId('status-main')).toHaveTextContent('not-authenticated')
    })
  })

  describe('State Inconsistency Detection and Repair', () => {
    it('should detect and repair token without user info', async () => {
      // Setup inconsistent state - token but no user info
      localStorage.setItem('auth_token', 'orphaned-token')
      localStorage.removeItem('user_info')

      // Mock token validation failure
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: { code: 'TOKEN_INVALID', message: 'Token is invalid' }
        })
      })

      render(<AuthStateDisplay id="repair" />)

      // Should detect inconsistency and clear invalid state
      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBeNull()
        expect(screen.getByTestId('status-repair')).toHaveTextContent('not-authenticated')
      })
    })

    it('should detect and repair user info without token', async () => {
      // Setup inconsistent state - user info but no token
      localStorage.removeItem('auth_token')
      localStorage.setItem('user_info', JSON.stringify({
        id: '1',
        name: 'Orphaned User',
        email: 'orphaned@example.com'
      }))

      render(<AuthStateDisplay id="repair" />)

      // Should detect inconsistency and clear orphaned user info
      await waitFor(() => {
        expect(localStorage.getItem('user_info')).toBeNull()
        expect(screen.getByTestId('status-repair')).toHaveTextContent('not-authenticated')
        expect(screen.getByTestId('user-repair')).toHaveTextContent('no-user')
      })
    })

    it('should handle corrupted localStorage data', async () => {
      // Setup corrupted data
      localStorage.setItem('auth_token', 'valid-token')
      localStorage.setItem('user_info', 'invalid-json-data')

      render(<AuthStateDisplay id="repair" />)

      // Should handle corruption gracefully
      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBeNull()
        expect(localStorage.getItem('user_info')).toBeNull()
        expect(screen.getByTestId('status-repair')).toHaveTextContent('not-authenticated')
      })
    })

    it('should auto-refresh expired tokens', async () => {
      // Setup expired token
      localStorage.setItem('auth_token', 'expired-token')
      localStorage.setItem('user_info', JSON.stringify({
        id: '1',
        name: 'Expired User',
        email: 'expired@example.com'
      }))

      // Mock token refresh success
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          // First call - token validation fails
          ok: false,
          json: async () => ({
            success: false,
            error: { code: 'TOKEN_EXPIRED', message: 'Token expired' }
          })
        })
        .mockResolvedValueOnce({
          // Second call - token refresh succeeds
          ok: true,
          json: async () => ({
            success: true,
            token: 'refreshed-token',
            user: {
              id: '1',
              name: 'Refreshed User',
              email: 'expired@example.com'
            }
          })
        })

      render(<AuthStateDisplay id="refresh" />)

      // Should auto-refresh the token
      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBe('refreshed-token')
        expect(screen.getByTestId('status-refresh')).toHaveTextContent('authenticated')
        expect(screen.getByTestId('user-refresh')).toHaveTextContent('Refreshed User')
      })

      // Should have made both validation and refresh calls
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Timeout and Retry Handling', () => {
    it('should handle authentication timeout with retry option', async () => {
      let attemptCount = 0
      global.fetch = jest.fn().mockImplementation(() => {
        attemptCount++
        if (attemptCount <= 2) {
          return Promise.reject(new Error('Request timeout'))
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            token: 'retry-success-token',
            user: { id: '1', name: 'Retry User', email: 'retry@example.com' }
          })
        })
      })

      render(
        <div>
          <AuthController />
          <AuthStateDisplay id="timeout" />
        </div>
      )

      // Attempt login
      await userEvent.click(screen.getByTestId('login-btn'))

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(screen.getByTestId('status-timeout')).toHaveTextContent('authenticated')
        expect(screen.getByTestId('user-timeout')).toHaveTextContent('Retry User')
      }, { timeout: 5000 })

      expect(attemptCount).toBe(3) // Failed twice, succeeded on third try
    })

    it('should show retry option after max timeout attempts', async () => {
      // Mock persistent timeout
      global.fetch = jest.fn().mockRejectedValue(new Error('Persistent timeout'))

      render(
        <div>
          <AuthController />
          <AuthStateDisplay id="persistent-timeout" />
        </div>
      )

      // Attempt login
      await userEvent.click(screen.getByTestId('login-btn'))

      // Should show error with retry option
      await waitFor(() => {
        expect(screen.getByTestId('error-persistent-timeout')).toHaveTextContent(/timeout/i)
      }, { timeout: 5000 })

      // Should still be not authenticated
      expect(screen.getByTestId('status-persistent-timeout')).toHaveTextContent('not-authenticated')
    })

    it('should handle partial network failures gracefully', async () => {
      let callCount = 0
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call - network error
          return Promise.reject(new Error('Network error'))
        } else if (callCount === 2) {
          // Second call - server error
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({
              success: false,
              error: { code: 'SERVER_ERROR', message: 'Internal server error' }
            })
          })
        } else {
          // Third call - success
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              token: 'recovery-token',
              user: { id: '1', name: 'Recovery User', email: 'recovery@example.com' }
            })
          })
        }
      })

      render(
        <div>
          <AuthController />
          <AuthStateDisplay id="recovery" />
        </div>
      )

      // Attempt login
      await userEvent.click(screen.getByTestId('login-btn'))

      // Should eventually recover and succeed
      await waitFor(() => {
        expect(screen.getByTestId('status-recovery')).toHaveTextContent('authenticated')
        expect(screen.getByTestId('user-recovery')).toHaveTextContent('Recovery User')
      }, { timeout: 5000 })

      expect(callCount).toBe(3)
    })
  })

  describe('Performance and Memory Management', () => {
    it('should not create memory leaks during rapid state changes', async () => {
      const { unmount } = render(<MultiComponentApp />)

      // Perform many rapid state changes
      for (let i = 0; i < 50; i++) {
        act(() => {
          localStorage.setItem('auth_token', `token-${i}`)
          localStorage.setItem('user_info', JSON.stringify({
            id: i.toString(),
            name: `User ${i}`,
            email: `user${i}@example.com`
          }))
          
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'auth_token',
            newValue: `token-${i}`,
            oldValue: i > 0 ? `token-${i-1}` : null,
            storageArea: localStorage
          }))
        })
      }

      // Cleanup
      unmount()
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      // Memory usage should be reasonable (this is a basic check)
      expect(process.memoryUsage().heapUsed).toBeLessThan(100 * 1024 * 1024) // Less than 100MB
    })

    it('should debounce rapid storage events', async () => {
      let updateCount = 0
      const TestComponent: React.FC = () => {
        const { authState } = useUnifiedAuthManager()
        
        useEffect(() => {
          updateCount++
        }, [authState.user])

        return <div data-testid="debounce-test">{authState.user?.name || 'no-user'}</div>
      }

      render(<TestComponent />)

      // Fire many rapid storage events
      act(() => {
        for (let i = 0; i < 10; i++) {
          localStorage.setItem('user_info', JSON.stringify({
            id: i.toString(),
            name: `Rapid User ${i}`,
            email: `rapid${i}@example.com`
          }))
          
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'user_info',
            newValue: localStorage.getItem('user_info'),
            oldValue: null,
            storageArea: localStorage
          }))
        }
      })

      await waitFor(() => {
        expect(screen.getByTestId('debounce-test')).toHaveTextContent('Rapid User 9')
      })

      // Should have debounced the updates (fewer than 10 updates)
      expect(updateCount).toBeLessThan(10)
    })
  })
})