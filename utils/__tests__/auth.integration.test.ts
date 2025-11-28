/**
 * Authentication System Integration Tests
 * 
 * This file contains comprehensive integration tests for the authentication system,
 * covering end-to-end login flows, error scenarios, and cross-component state synchronization.
 * 
 * Requirements covered:
 * - 1.3: 当登录成功时，系统应该正确设置用户会话状态和本地存储
 * - 1.4: 当存在网络或服务器错误时，系统应该提供有意义的错误反馈给用户
 * - 2.4: 当Google用户再次登录时，系统应该识别现有账户并成功登录
 * - 2.5: 当OAuth流程中出现错误时，系统应该提供具体的错误信息
 * - 3.3: 当认证状态不一致时，系统应该自动修复或提示用户重新登录
 * - 3.4: 当认证过程超时时，系统应该提供重试选项
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthenticationService } from '../authenticationService'
import { UserRepository } from '../userRepository'
import { UnifiedAuthManager } from '../unifiedAuthManager'
import { AuthErrorHandler } from '../authErrorHandler'
import { AuthForm } from '../../components/AuthForm'
import { useUnifiedAuthManager } from '../../hooks/useUnifiedAuthManager'
import React from 'react'

// Mock modules
jest.mock('../userRepository')
jest.mock('../authErrorHandler')

// Test component for auth state synchronization
const TestAuthComponent: React.FC = () => {
  const { authState, login, logout } = useUnifiedAuthManager()
  
  return (
    <div>
      <div data-testid="auth-status">
        {authState.isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-info">
        {authState.user ? authState.user.name : 'no-user'}
      </div>
      <div data-testid="loading-status">
        {authState.loading ? 'loading' : 'not-loading'}
      </div>
      <div data-testid="error-message">
        {authState.error || 'no-error'}
      </div>
      <button 
        data-testid="login-button" 
        onClick={() => login({ email: 'test@example.com', password: 'password123' })}
      >
        Login
      </button>
      <button data-testid="logout-button" onClick={logout}>
        Logout
      </button>
    </div>
  )
}

describe('Authentication System Integration Tests', () => {
  let mockUserRepository: jest.Mocked<UserRepository>
  let mockAuthErrorHandler: jest.Mocked<AuthErrorHandler>
  let authService: AuthenticationService
  let authManager: UnifiedAuthManager

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup mock implementations
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>
    mockAuthErrorHandler = new AuthErrorHandler() as jest.Mocked<AuthErrorHandler>
    
    // Create service instances
    authService = new AuthenticationService(mockUserRepository, mockAuthErrorHandler)
    authManager = new UnifiedAuthManager(authService)
    
    // Clear storage
    localStorage.clear()
    sessionStorage.clear()
    document.cookie = ''
  })

  describe('Complete Login Flow Integration', () => {
    it('should complete successful password login flow end-to-end', async () => {
      // Mock successful user lookup and validation
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        isGoogleUser: false,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepository.findByEmail.mockResolvedValue(mockUser)
      mockUserRepository.validateCredentials.mockResolvedValue(true)

      // Mock successful API response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          token: 'mock-jwt-token',
          user: mockUser
        })
      })

      // Render auth form
      render(<AuthForm />)

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const loginButton = screen.getByRole('button', { name: /sign in/i })

      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'password123')

      // Submit form
      await userEvent.click(loginButton)

      // Wait for login to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      })

      // Verify success state
      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBe('mock-jwt-token')
        expect(localStorage.getItem('user_info')).toBe(JSON.stringify(mockUser))
      })
    })

    it('should handle Google OAuth login flow end-to-end', async () => {
      const mockGoogleUser = {
        id: '2',
        name: 'Google User',
        email: 'google@example.com',
        isGoogleUser: true,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Mock Google OAuth success
      mockUserRepository.findByEmail.mockResolvedValue(mockGoogleUser)
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          token: 'google-jwt-token',
          user: mockGoogleUser
        })
      })

      // Simulate Google OAuth callback
      const authResult = await authService.loginWithGoogle('google-token', 'google@example.com')

      expect(authResult.success).toBe(true)
      expect(authResult.token).toBe('google-jwt-token')
      expect(authResult.user).toEqual(mockGoogleUser)
    })

    it('should handle new Google user registration during login', async () => {
      const newGoogleUser = {
        id: '3',
        name: 'New Google User',
        email: 'newgoogle@example.com',
        isGoogleUser: true,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Mock user not found, then successful creation
      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockUserRepository.createUser.mockResolvedValue(newGoogleUser)

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          token: 'new-google-jwt-token',
          user: newGoogleUser
        })
      })

      const authResult = await authService.loginWithGoogle('google-token', 'newgoogle@example.com')

      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        name: 'New Google User',
        email: 'newgoogle@example.com',
        isGoogleUser: true
      })
      expect(authResult.success).toBe(true)
    })
  })

  describe('Error Scenario Integration Tests', () => {
    it('should handle invalid credentials with specific error messages', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockAuthErrorHandler.handleAuthError.mockReturnValue({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
        details: null
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        })
      })

      render(<AuthForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const loginButton = screen.getByRole('button', { name: /sign in/i })

      await userEvent.type(emailInput, 'nonexistent@example.com')
      await userEvent.type(passwordInput, 'wrongpassword')
      await userEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText(/user not found/i)).toBeInTheDocument()
      })
    })

    it('should handle network errors with retry option', async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      mockAuthErrorHandler.handleAuthError.mockReturnValue({
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Please try again.',
        details: null
      })

      render(<AuthForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const loginButton = screen.getByRole('button', { name: /sign in/i })

      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(passwordInput, 'password123')
      await userEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByText(/network connection failed/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })

    it('should handle Google OAuth errors with specific messages', async () => {
      mockAuthErrorHandler.handleAuthError.mockReturnValue({
        code: 'GOOGLE_AUTH_FAILED',
        message: 'Google authentication failed. Please try again.',
        details: null
      })

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            code: 'GOOGLE_AUTH_FAILED',
            message: 'Invalid Google token'
          }
        })
      })

      const authResult = await authService.loginWithGoogle('invalid-token', 'test@example.com')

      expect(authResult.success).toBe(false)
      expect(authResult.error?.code).toBe('GOOGLE_AUTH_FAILED')
      expect(mockAuthErrorHandler.handleAuthError).toHaveBeenCalled()
    })

    it('should handle authentication timeout with retry option', async () => {
      // Mock timeout
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )

      mockAuthErrorHandler.handleAuthError.mockReturnValue({
        code: 'TIMEOUT_ERROR',
        message: 'Request timed out. Please try again.',
        details: null
      })

      const authResult = await authService.loginWithPassword('test@example.com', 'password123')

      expect(authResult.success).toBe(false)
      expect(authResult.error?.code).toBe('TIMEOUT_ERROR')
    })
  })

  describe('Authentication State Synchronization Tests', () => {
    it('should synchronize auth state across multiple components', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        isGoogleUser: false,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Mock successful login
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          token: 'sync-test-token',
          user: mockUser
        })
      })

      // Render multiple components that use auth state
      const { rerender } = render(
        <div>
          <TestAuthComponent />
          <TestAuthComponent />
        </div>
      )

      const loginButtons = screen.getAllByTestId('login-button')
      const authStatuses = screen.getAllByTestId('auth-status')

      // Initially not authenticated
      authStatuses.forEach(status => {
        expect(status).toHaveTextContent('not-authenticated')
      })

      // Login from first component
      await userEvent.click(loginButtons[0])

      // Wait for state to sync across all components
      await waitFor(() => {
        authStatuses.forEach(status => {
          expect(status).toHaveTextContent('authenticated')
        })
      })

      // Verify user info is synced
      const userInfos = screen.getAllByTestId('user-info')
      userInfos.forEach(info => {
        expect(info).toHaveTextContent('Test User')
      })
    })

    it('should handle auth state inconsistency and auto-repair', async () => {
      // Set inconsistent state - token in localStorage but no user info
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

      render(<TestAuthComponent />)

      // Should detect inconsistency and clear invalid state
      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBeNull()
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
      })
    })

    it('should synchronize logout across multiple tabs/components', async () => {
      // Setup authenticated state
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        isGoogleUser: false,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      localStorage.setItem('auth_token', 'test-token')
      localStorage.setItem('user_info', JSON.stringify(mockUser))

      render(
        <div>
          <TestAuthComponent />
          <TestAuthComponent />
        </div>
      )

      const logoutButtons = screen.getAllByTestId('logout-button')
      const authStatuses = screen.getAllByTestId('auth-status')

      // Initially authenticated
      await waitFor(() => {
        authStatuses.forEach(status => {
          expect(status).toHaveTextContent('authenticated')
        })
      })

      // Logout from first component
      await userEvent.click(logoutButtons[0])

      // Should sync logout across all components
      await waitFor(() => {
        authStatuses.forEach(status => {
          expect(status).toHaveTextContent('not-authenticated')
        })
        expect(localStorage.getItem('auth_token')).toBeNull()
        expect(localStorage.getItem('user_info')).toBeNull()
      })
    })

    it('should handle storage events for cross-tab synchronization', async () => {
      render(<TestAuthComponent />)

      const authStatus = screen.getByTestId('auth-status')
      const userInfo = screen.getByTestId('user-info')

      // Initially not authenticated
      expect(authStatus).toHaveTextContent('not-authenticated')

      // Simulate login in another tab by triggering storage event
      const mockUser = {
        id: '1',
        name: 'Cross Tab User',
        email: 'crosstab@example.com',
        isGoogleUser: false,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      act(() => {
        localStorage.setItem('auth_token', 'cross-tab-token')
        localStorage.setItem('user_info', JSON.stringify(mockUser))
        
        // Trigger storage event
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'auth_token',
          newValue: 'cross-tab-token',
          oldValue: null,
          storageArea: localStorage
        }))
      })

      // Should sync state from storage event
      await waitFor(() => {
        expect(authStatus).toHaveTextContent('authenticated')
        expect(userInfo).toHaveTextContent('Cross Tab User')
      })
    })

    it('should maintain auth state consistency during page refresh', async () => {
      const mockUser = {
        id: '1',
        name: 'Persistent User',
        email: 'persistent@example.com',
        isGoogleUser: false,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Setup persistent auth state
      localStorage.setItem('auth_token', 'persistent-token')
      localStorage.setItem('user_info', JSON.stringify(mockUser))

      // Mock token validation success
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          valid: true,
          user: mockUser
        })
      })

      render(<TestAuthComponent />)

      // Should restore auth state from localStorage
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
        expect(screen.getByTestId('user-info')).toHaveTextContent('Persistent User')
      })

      // Verify token validation was called
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer persistent-token'
        }
      })
    })
  })

  describe('Error Recovery and Resilience Tests', () => {
    it('should recover from temporary network failures', async () => {
      let callCount = 0
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            token: 'recovery-token',
            user: { id: '1', name: 'Recovered User', email: 'test@example.com' }
          })
        })
      })

      const authResult = await authService.loginWithPassword('test@example.com', 'password123')

      // Should eventually succeed after retries
      expect(authResult.success).toBe(true)
      expect(callCount).toBe(3) // Failed twice, succeeded on third try
    })

    it('should handle concurrent login attempts gracefully', async () => {
      const mockUser = {
        id: '1',
        name: 'Concurrent User',
        email: 'concurrent@example.com',
        isGoogleUser: false,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          token: 'concurrent-token',
          user: mockUser
        })
      })

      // Start multiple concurrent login attempts
      const loginPromises = [
        authService.loginWithPassword('concurrent@example.com', 'password123'),
        authService.loginWithPassword('concurrent@example.com', 'password123'),
        authService.loginWithPassword('concurrent@example.com', 'password123')
      ]

      const results = await Promise.all(loginPromises)

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true)
      })

      // But only one actual API call should be made (due to deduplication)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should handle malformed API responses gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          // Missing required fields
          success: true
          // No token or user
        })
      })

      mockAuthErrorHandler.handleAuthError.mockReturnValue({
        code: 'INVALID_RESPONSE',
        message: 'Invalid server response',
        details: null
      })

      const authResult = await authService.loginWithPassword('test@example.com', 'password123')

      expect(authResult.success).toBe(false)
      expect(authResult.error?.code).toBe('INVALID_RESPONSE')
    })
  })

  describe('Performance and Load Tests', () => {
    it('should handle rapid successive auth state changes', async () => {
      render(<TestAuthComponent />)

      const loginButton = screen.getByTestId('login-button')
      const logoutButton = screen.getByTestId('logout-button')

      // Mock fast responses
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          token: 'rapid-token',
          user: { id: '1', name: 'Rapid User', email: 'rapid@example.com' }
        })
      })

      // Rapid login/logout cycles
      for (let i = 0; i < 5; i++) {
        await userEvent.click(loginButton)
        await waitFor(() => {
          expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
        })

        await userEvent.click(logoutButton)
        await waitFor(() => {
          expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
        })
      }

      // Should handle all state changes correctly
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    })

    it('should not leak memory during auth state changes', async () => {
      const initialMemory = process.memoryUsage().heapUsed

      // Perform many auth operations
      for (let i = 0; i < 100; i++) {
        const authManager = new UnifiedAuthManager(authService)
        await authManager.login({ email: 'test@example.com', password: 'password123' })
        await authManager.logout()
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })
  })
})