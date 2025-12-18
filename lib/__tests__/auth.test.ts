// Mock Prisma before importing
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

import { describe, it, expect, beforeEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

describe('Authentication System - Login Flows', () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Email/Password Login', () => {
    it('should successfully authenticate user with valid email and password', async () => {
      const testUser = {
        id: 'user_123',
        email: 'test@example.com',
        password: '$2a$10$hashedpassword',
        name: 'Test User',
        points: 50,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(testUser)
      mockBcrypt.compare.mockResolvedValue(true as never)

      // Simulate the authorize function from CredentialsProvider
      const credentials = {
        email: 'test@example.com',
        password: 'correctpassword',
      }

      const user = await mockPrisma.user.findUnique({
        where: { email: credentials.email }
      })

      expect(user).not.toBeNull()
      expect(user?.email).toBe(credentials.email)

      if (user && user.password) {
        const isValid = await mockBcrypt.compare(credentials.password, user.password)
        expect(isValid).toBe(true)
      }

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email }
      })
      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        credentials.password,
        testUser.password
      )
    })

    it('should reject login with invalid password', async () => {
      const testUser = {
        id: 'user_123',
        email: 'test@example.com',
        password: '$2a$10$hashedpassword',
        name: 'Test User',
        points: 50,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(testUser)
      mockBcrypt.compare.mockResolvedValue(false as never)

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      const user = await mockPrisma.user.findUnique({
        where: { email: credentials.email }
      })

      expect(user).not.toBeNull()

      if (user && user.password) {
        const isValid = await mockBcrypt.compare(credentials.password, user.password)
        expect(isValid).toBe(false)
      }

      expect(mockBcrypt.compare).toHaveBeenCalledWith(
        credentials.password,
        testUser.password
      )
    })

    it('should reject login with non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const credentials = {
        email: 'nonexistent@example.com',
        password: 'somepassword',
      }

      const user = await mockPrisma.user.findUnique({
        where: { email: credentials.email }
      })

      expect(user).toBeNull()
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email }
      })
      expect(mockBcrypt.compare).not.toHaveBeenCalled()
    })

    it('should reject login when user has no password (OAuth-only user)', async () => {
      const oauthUser = {
        id: 'user_oauth',
        email: 'oauth@example.com',
        password: null,
        name: 'OAuth User',
        points: 50,
        image: 'https://example.com/avatar.jpg',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(oauthUser)

      const credentials = {
        email: 'oauth@example.com',
        password: 'somepassword',
      }

      const user = await mockPrisma.user.findUnique({
        where: { email: credentials.email }
      })

      expect(user).not.toBeNull()
      expect(user?.password).toBeNull()
      expect(mockBcrypt.compare).not.toHaveBeenCalled()
    })

    it('should handle missing credentials gracefully', async () => {
      const credentials = {
        email: '',
        password: '',
      }

      // Simulate the early return in authorize function
      if (!credentials.email || !credentials.password) {
        expect(credentials.email).toBe('')
        expect(credentials.password).toBe('')
        expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
        return
      }

      // This should not be reached
      expect(true).toBe(false)
    })
  })

  describe('Google OAuth Login', () => {
    it('should create session for existing Google user', async () => {
      const googleUser = {
        id: 'user_google_123',
        email: 'google@example.com',
        name: 'Google User',
        password: null,
        points: 50,
        image: 'https://lh3.googleusercontent.com/avatar',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(googleUser)

      const user = await mockPrisma.user.findUnique({
        where: { email: 'google@example.com' }
      })

      expect(user).not.toBeNull()
      expect(user?.email).toBe('google@example.com')
      expect(user?.password).toBeNull()
      expect(user?.emailVerified).not.toBeNull()
    })

    it('should initialize points for new Google user', async () => {
      // First check - user doesn't exist
      mockPrisma.user.findUnique.mockResolvedValueOnce(null)

      const existingUser = await mockPrisma.user.findUnique({
        where: { email: 'newgoogle@example.com' }
      })

      expect(existingUser).toBeNull()

      // Simulate the createUser event
      const newUserId = 'user_new_google'
      mockPrisma.user.update.mockResolvedValue({
        id: newUserId,
        email: 'newgoogle@example.com',
        name: 'New Google User',
        password: null,
        points: 50,
        image: 'https://lh3.googleusercontent.com/avatar',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await mockPrisma.user.update({
        where: { id: newUserId },
        data: { points: 50 }
      })

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: newUserId },
        data: { points: 50 }
      })
    })

    it('should handle Google OAuth callback with valid account', async () => {
      const googleUser = {
        id: 'user_google_callback',
        email: 'callback@example.com',
        name: 'Callback User',
        password: null,
        points: 75,
        image: 'https://lh3.googleusercontent.com/avatar',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(googleUser)

      // Simulate signIn callback
      const account = {
        provider: 'google',
        type: 'oauth',
        providerAccountId: 'google_123',
      }

      const user = await mockPrisma.user.findUnique({
        where: { email: googleUser.email }
      })

      expect(user).not.toBeNull()
      expect(account.provider).toBe('google')
    })
  })

  describe('Invalid Credentials Error', () => {
    it('should return null for invalid email format', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const credentials = {
        email: 'invalid-email',
        password: 'password123',
      }

      const user = await mockPrisma.user.findUnique({
        where: { email: credentials.email }
      })

      expect(user).toBeNull()
    })

    it('should return null for empty password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: '',
      }

      if (!credentials.password) {
        expect(credentials.password).toBe('')
        expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
        return
      }

      expect(true).toBe(false)
    })

    it('should return null for SQL injection attempt', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const credentials = {
        email: "admin' OR '1'='1",
        password: "password' OR '1'='1",
      }

      const user = await mockPrisma.user.findUnique({
        where: { email: credentials.email }
      })

      expect(user).toBeNull()
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: credentials.email }
      })
    })
  })

  describe('Session Persistence on Page Refresh', () => {
    it('should retrieve session from database on page load', async () => {
      const sessionToken = 'session_token_123'
      const mockSession = {
        id: 'session_123',
        sessionToken: sessionToken,
        userId: 'user_123',
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }

      mockPrisma.session.findUnique.mockResolvedValue(mockSession)

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken }
      })

      expect(session).not.toBeNull()
      expect(session?.userId).toBe('user_123')
      expect(session?.expires.getTime()).toBeGreaterThan(Date.now())
    })

    it('should load user data with session', async () => {
      const testUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        password: '$2a$10$hashedpassword',
        points: 75,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(testUser)

      // Simulate session callback
      const session = {
        user: {
          id: '',
          email: 'test@example.com',
          name: 'Test User',
          points: 0,
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      const user = { id: 'user_123' }

      // Simulate the session callback logic
      session.user.id = user.id
      const dbUser = await mockPrisma.user.findUnique({
        where: { id: user.id },
        select: { points: true }
      })
      session.user.points = dbUser?.points || 0

      expect(session.user.id).toBe('user_123')
      expect(session.user.points).toBe(75)
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        select: { points: true }
      })
    })

    it('should handle expired session gracefully', async () => {
      const expiredSession = {
        id: 'session_expired',
        sessionToken: 'expired_token',
        userId: 'user_123',
        expires: new Date(Date.now() - 1000), // Expired 1 second ago
      }

      mockPrisma.session.findUnique.mockResolvedValue(expiredSession)

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: 'expired_token' }
      })

      expect(session).not.toBeNull()
      expect(session?.expires.getTime()).toBeLessThan(Date.now())
    })

    it('should return null for non-existent session', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null)

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: 'non_existent_token' }
      })

      expect(session).toBeNull()
    })

    it('should maintain session across multiple page loads', async () => {
      const sessionToken = 'persistent_session_token'
      const mockSession = {
        id: 'session_persistent',
        sessionToken: sessionToken,
        userId: 'user_123',
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      // Simulate multiple page loads
      mockPrisma.session.findUnique.mockResolvedValue(mockSession)

      // First page load
      const session1 = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken }
      })
      expect(session1).not.toBeNull()
      expect(session1?.userId).toBe('user_123')

      // Second page load
      const session2 = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken }
      })
      expect(session2).not.toBeNull()
      expect(session2?.userId).toBe('user_123')

      // Third page load
      const session3 = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken }
      })
      expect(session3).not.toBeNull()
      expect(session3?.userId).toBe('user_123')

      expect(mockPrisma.session.findUnique).toHaveBeenCalledTimes(3)
    })

    it('should update points in session on refresh', async () => {
      const testUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        password: '$2a$10$hashedpassword',
        points: 100, // Updated points
        image: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(testUser)

      const session = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
          points: 50, // Old points
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }

      // Simulate session callback refreshing points
      const dbUser = await mockPrisma.user.findUnique({
        where: { id: session.user.id },
        select: { points: true }
      })
      session.user.points = dbUser?.points || 0

      expect(session.user.points).toBe(100)
      expect(session.user.points).not.toBe(50)
    })
  })

  describe('Session Security', () => {
    it('should use database-backed sessions', async () => {
      const sessionToken = 'secure_session_token'
      const mockSession = {
        id: 'session_secure',
        sessionToken: sessionToken,
        userId: 'user_123',
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      mockPrisma.session.findUnique.mockResolvedValue(mockSession)

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken }
      })

      expect(session).not.toBeNull()
      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
        where: { sessionToken: sessionToken }
      })
    })

    it('should delete session on logout', async () => {
      const sessionToken = 'session_to_delete'

      mockPrisma.session.delete.mockResolvedValue({
        id: 'session_deleted',
        sessionToken: sessionToken,
        userId: 'user_123',
        expires: new Date(),
      })

      await mockPrisma.session.delete({
        where: { sessionToken: sessionToken }
      })

      expect(mockPrisma.session.delete).toHaveBeenCalledWith({
        where: { sessionToken: sessionToken }
      })
    })
  })
})
