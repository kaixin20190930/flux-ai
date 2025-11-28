/**
 * Authentication API Integration Tests
 * 
 * Tests the integration between frontend components and backend API endpoints,
 * ensuring proper error handling, response formatting, and state management.
 * 
 * Requirements covered:
 * - 1.3: 当登录成功时，系统应该正确设置用户会话状态和本地存储
 * - 1.4: 当存在网络或服务器错误时，系统应该提供有意义的错误反馈给用户
 * - 2.4: 当Google用户再次登录时，系统应该识别现有账户并成功登录
 * - 2.5: 当OAuth流程中出现错误时，系统应该提供具体的错误信息
 */

import { NextRequest, NextResponse } from 'next/server'
import { POST as loginHandler } from '../../app/api/auth/login/route'
import { POST as registerHandler } from '../../app/api/auth/register/route'
import { GET as googleCallbackHandler } from '../../app/api/auth/google/callback/route'
import { UserRepository } from '../userRepository'
import { AuthenticationService } from '../authenticationService'
import { AuthErrorHandler } from '../authErrorHandler'

// Mock dependencies
jest.mock('../userRepository')
jest.mock('../authErrorHandler')

describe('Authentication API Integration Tests', () => {
  let mockUserRepository: jest.Mocked<UserRepository>
  let mockAuthErrorHandler: jest.Mocked<AuthErrorHandler>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>
    mockAuthErrorHandler = new AuthErrorHandler() as jest.Mocked<AuthErrorHandler>
    
    // Setup default mock implementations
    mockAuthErrorHandler.handleAuthError.mockImplementation((error, context) => ({
      code: 'GENERIC_ERROR',
      message: 'An error occurred',
      details: error
    }))
  })

  describe('Login API Integration', () => {
    it('should handle successful login request', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.token).toBeDefined()
      expect(data.user).toEqual(expect.objectContaining({
        id: '1',
        name: 'Test User',
        email: 'test@example.com'
      }))
    })

    it('should handle invalid credentials with proper error response', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null)
      mockAuthErrorHandler.handleAuthError.mockReturnValue({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        details: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_CREDENTIALS')
      expect(data.error.message).toBe('Invalid email or password')
    })

    it('should handle malformed request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_REQUEST')
    })

    it('should handle database connection errors', async () => {
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database connection failed'))
      mockAuthErrorHandler.handleAuthError.mockReturnValue({
        code: 'DATABASE_ERROR',
        message: 'Database connection failed',
        details: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('DATABASE_ERROR')
    })
  })

  describe('Registration API Integration', () => {
    it('should handle successful user registration', async () => {
      const newUser = {
        id: '2',
        name: 'New User',
        email: 'newuser@example.com',
        isGoogleUser: false,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepository.findByEmail.mockResolvedValue(null) // User doesn't exist
      mockUserRepository.createUser.mockResolvedValue(newUser)

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.token).toBeDefined()
      expect(data.user).toEqual(expect.objectContaining({
        id: '2',
        name: 'New User',
        email: 'newuser@example.com'
      }))
    })

    it('should handle duplicate email registration', async () => {
      const existingUser = {
        id: '1',
        name: 'Existing User',
        email: 'existing@example.com',
        isGoogleUser: false,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepository.findByEmail.mockResolvedValue(existingUser)
      mockAuthErrorHandler.handleAuthError.mockReturnValue({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists',
        details: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New User',
          email: 'existing@example.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('EMAIL_ALREADY_EXISTS')
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: '',
          email: 'invalid-email',
          password: '123' // Too short
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.details).toEqual(expect.arrayContaining([
        expect.objectContaining({ field: 'name' }),
        expect.objectContaining({ field: 'email' }),
        expect.objectContaining({ field: 'password' })
      ]))
    })
  })

  describe('Google OAuth Integration', () => {
    it('should handle successful Google OAuth callback', async () => {
      const googleUser = {
        id: '3',
        name: 'Google User',
        email: 'google@example.com',
        isGoogleUser: true,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepository.findByEmail.mockResolvedValue(googleUser)

      // Mock Google token verification
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          email: 'google@example.com',
          name: 'Google User',
          picture: 'https://example.com/avatar.jpg'
        })
      })

      const request = new NextRequest('http://localhost:3000/api/auth/google/callback?code=google-auth-code&state=csrf-token', {
        method: 'GET'
      })

      const response = await googleCallbackHandler(request)

      expect(response.status).toBe(302) // Redirect
      expect(response.headers.get('Location')).toContain('/auth/success')
    })

    it('should handle new Google user registration', async () => {
      const newGoogleUser = {
        id: '4',
        name: 'New Google User',
        email: 'newgoogle@example.com',
        isGoogleUser: true,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepository.findByEmail.mockResolvedValue(null) // User doesn't exist
      mockUserRepository.createUser.mockResolvedValue(newGoogleUser)

      // Mock Google token verification
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          email: 'newgoogle@example.com',
          name: 'New Google User',
          picture: 'https://example.com/avatar.jpg'
        })
      })

      const request = new NextRequest('http://localhost:3000/api/auth/google/callback?code=google-auth-code&state=csrf-token', {
        method: 'GET'
      })

      const response = await googleCallbackHandler(request)

      expect(mockUserRepository.createUser).toHaveBeenCalledWith({
        name: 'New Google User',
        email: 'newgoogle@example.com',
        isGoogleUser: true
      })
      expect(response.status).toBe(302)
    })

    it('should handle invalid Google OAuth code', async () => {
      // Mock Google token verification failure
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'invalid_grant'
        })
      })

      const request = new NextRequest('http://localhost:3000/api/auth/google/callback?code=invalid-code&state=csrf-token', {
        method: 'GET'
      })

      const response = await googleCallbackHandler(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('Location')).toContain('/auth?error=google_auth_failed')
    })

    it('should handle missing OAuth parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/google/callback', {
        method: 'GET'
      })

      const response = await googleCallbackHandler(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('Location')).toContain('/auth?error=missing_parameters')
    })

    it('should validate CSRF state parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/google/callback?code=valid-code&state=invalid-state', {
        method: 'GET'
      })

      const response = await googleCallbackHandler(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('Location')).toContain('/auth?error=invalid_state')
    })
  })

  describe('Cross-API Integration Tests', () => {
    it('should maintain consistent user data across login and registration', async () => {
      const userData = {
        name: 'Consistent User',
        email: 'consistent@example.com',
        password: 'password123'
      }

      // First, register the user
      mockUserRepository.findByEmail.mockResolvedValue(null)
      const newUser = {
        id: '5',
        name: userData.name,
        email: userData.email,
        isGoogleUser: false,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockUserRepository.createUser.mockResolvedValue(newUser)

      const registerRequest = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: { 'Content-Type': 'application/json' }
      })

      const registerResponse = await registerHandler(registerRequest)
      const registerData = await registerResponse.json()

      expect(registerResponse.status).toBe(201)
      expect(registerData.success).toBe(true)

      // Then, login with the same credentials
      mockUserRepository.findByEmail.mockResolvedValue(newUser)
      mockUserRepository.validateCredentials.mockResolvedValue(true)

      const loginRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: userData.email,
          password: userData.password
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const loginResponse = await loginHandler(loginRequest)
      const loginData = await loginResponse.json()

      expect(loginResponse.status).toBe(200)
      expect(loginData.success).toBe(true)
      expect(loginData.user.email).toBe(registerData.user.email)
      expect(loginData.user.name).toBe(registerData.user.name)
    })

    it('should handle concurrent API requests gracefully', async () => {
      const mockUser = {
        id: '6',
        name: 'Concurrent User',
        email: 'concurrent@example.com',
        isGoogleUser: false,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepository.findByEmail.mockResolvedValue(mockUser)
      mockUserRepository.validateCredentials.mockResolvedValue(true)

      // Create multiple concurrent login requests
      const requests = Array.from({ length: 5 }, () => 
        new NextRequest('http://localhost:3000/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            email: 'concurrent@example.com',
            password: 'password123'
          }),
          headers: { 'Content-Type': 'application/json' }
        })
      )

      // Execute all requests concurrently
      const responses = await Promise.all(
        requests.map(request => loginHandler(request))
      )

      // All should succeed
      for (const response of responses) {
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })

    it('should handle API rate limiting', async () => {
      const mockUser = {
        id: '7',
        name: 'Rate Limited User',
        email: 'ratelimited@example.com',
        isGoogleUser: false,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Mock rate limit exceeded
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Rate limit exceeded'))
      mockAuthErrorHandler.handleAuthError.mockReturnValue({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        details: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'ratelimited@example.com',
          password: 'password123'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED')
    })
  })

  describe('Error Handling Integration', () => {
    it('should provide consistent error format across all endpoints', async () => {
      const endpoints = [
        { handler: loginHandler, path: '/api/auth/login' },
        { handler: registerHandler, path: '/api/auth/register' }
      ]

      for (const endpoint of endpoints) {
        mockUserRepository.findByEmail.mockRejectedValue(new Error('Test error'))
        mockAuthErrorHandler.handleAuthError.mockReturnValue({
          code: 'TEST_ERROR',
          message: 'Test error message',
          details: null
        })

        const request = new NextRequest(`http://localhost:3000${endpoint.path}`, {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          }),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await endpoint.handler(request)
        const data = await response.json()

        expect(data).toEqual({
          success: false,
          error: {
            code: 'TEST_ERROR',
            message: 'Test error message',
            timestamp: expect.any(String),
            requestId: expect.any(String)
          }
        })
      }
    })

    it('should log errors appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'))
      mockAuthErrorHandler.handleAuthError.mockReturnValue({
        code: 'DATABASE_ERROR',
        message: 'Database connection failed',
        details: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      await loginHandler(request)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Authentication error'),
        expect.any(Object)
      )

      consoleSpy.mockRestore()
    })
  })
})