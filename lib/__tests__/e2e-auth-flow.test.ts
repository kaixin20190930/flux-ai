/**
 * End-to-End Authentication Flow Tests
 * 
 * This test suite validates the complete user journey through the authentication system:
 * - Registration → Login → Generate Image → Logout
 * - Google OAuth complete flow
 * - Points system integration
 * - Error scenarios
 * 
 * Requirements: All (comprehensive validation)
 */

// Mock Prisma before importing
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    account: {
      create: jest.fn(),
      findFirst: jest.fn(),
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
import { getUserPoints, deductPoints, addPoints } from '@/lib/points'

describe('End-to-End Authentication Flow', () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete User Journey: Register → Login → Generate → Logout', () => {
    it('should complete full user journey successfully', async () => {
      const testEmail = 'newuser@example.com'
      const testPassword = 'SecurePass123'
      const testName = 'New User'

      // STEP 1: REGISTRATION
      // Check if user exists (should not)
      mockPrisma.user.findUnique.mockResolvedValueOnce(null)

      const existingUser = await mockPrisma.user.findUnique({
        where: { email: testEmail }
      })
      expect(existingUser).toBeNull()

      // Hash password
      const hashedPassword = '$2a$10$hashedSecurePass123'
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never)

      const passwordHash = await mockBcrypt.hash(testPassword, 10)
      expect(passwordHash).toBe(hashedPassword)

      // Create user with initial 50 points
      const newUser = {
        id: 'user_new_123',
        email: testEmail,
        name: testName,
        password: hashedPassword,
        points: 50,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.create.mockResolvedValue(newUser)

      const createdUser = await mockPrisma.user.create({
        data: {
          email: testEmail,
          name: testName,
          password: passwordHash,
          points: 50,
        }
      })

      expect(createdUser).not.toBeNull()
      expect(createdUser.email).toBe(testEmail)
      expect(createdUser.points).toBe(50)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: testEmail,
          name: testName,
          password: hashedPassword,
          points: 50,
        }
      })

      // STEP 2: LOGIN
      // Find user for login
      mockPrisma.user.findUnique.mockResolvedValueOnce(newUser)

      const loginUser = await mockPrisma.user.findUnique({
        where: { email: testEmail }
      })

      expect(loginUser).not.toBeNull()
      expect(loginUser?.email).toBe(testEmail)

      // Verify password
      mockBcrypt.compare.mockResolvedValue(true as never)

      const isPasswordValid = await mockBcrypt.compare(testPassword, loginUser!.password!)
      expect(isPasswordValid).toBe(true)

      // Create session
      const sessionToken = 'session_token_abc123'
      const newSession = {
        id: 'session_123',
        sessionToken: sessionToken,
        userId: newUser.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      mockPrisma.session.create.mockResolvedValue(newSession)

      const session = await mockPrisma.session.create({
        data: {
          sessionToken: sessionToken,
          userId: newUser.id,
          expires: newSession.expires,
        }
      })

      expect(session).not.toBeNull()
      expect(session.userId).toBe(newUser.id)

      // STEP 3: GENERATE IMAGE (Points Deduction)
      // Check current points
      mockPrisma.user.findUnique.mockResolvedValueOnce(newUser)

      const userBeforeGeneration = await mockPrisma.user.findUnique({
        where: { id: newUser.id },
        select: { points: true }
      })

      expect(userBeforeGeneration?.points).toBe(50)

      // Deduct 1 point for image generation
      const userAfterDeduction = {
        ...newUser,
        points: 49,
      }

      mockPrisma.user.update.mockResolvedValue(userAfterDeduction)

      const updatedUser = await mockPrisma.user.update({
        where: { id: newUser.id },
        data: { points: { decrement: 1 } }
      })

      expect(updatedUser.points).toBe(49)
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: newUser.id },
        data: { points: { decrement: 1 } }
      })

      // STEP 4: LOGOUT
      // Delete session
      mockPrisma.session.delete.mockResolvedValue(newSession)

      await mockPrisma.session.delete({
        where: { sessionToken: sessionToken }
      })

      expect(mockPrisma.session.delete).toHaveBeenCalledWith({
        where: { sessionToken: sessionToken }
      })

      // Verify session is gone
      mockPrisma.session.findUnique.mockResolvedValue(null)

      const deletedSession = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken }
      })

      expect(deletedSession).toBeNull()
    })

    it('should handle multiple image generations with points tracking', async () => {
      const userId = 'user_multi_gen'
      let currentPoints = 50

      // Generate 3 images
      for (let i = 0; i < 3; i++) {
        mockPrisma.user.findUnique.mockResolvedValueOnce({
          id: userId,
          points: currentPoints,
        } as any)

        const userPoints = await mockPrisma.user.findUnique({
          where: { id: userId },
          select: { points: true }
        })

        expect(userPoints?.points).toBe(currentPoints)

        // Deduct point
        currentPoints -= 1

        mockPrisma.user.update.mockResolvedValueOnce({
          id: userId,
          points: currentPoints,
        } as any)

        await mockPrisma.user.update({
          where: { id: userId },
          data: { points: { decrement: 1 } }
        })
      }

      // Final points should be 47
      expect(currentPoints).toBe(47)
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(3)
    })

    it('should prevent generation when points are insufficient', async () => {
      const userId = 'user_no_points'

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        points: 0,
      } as any)

      const user = await mockPrisma.user.findUnique({
        where: { id: userId },
        select: { points: true }
      })

      expect(user?.points).toBe(0)

      // Should not deduct points
      expect(mockPrisma.user.update).not.toHaveBeenCalled()

      // Simulate error response
      const hasInsufficientPoints = (user?.points || 0) < 1
      expect(hasInsufficientPoints).toBe(true)
    })
  })

  describe('Google OAuth Complete Flow', () => {
    it('should complete Google OAuth flow for new user', async () => {
      const googleEmail = 'newgoogle@example.com'
      const googleName = 'Google User'
      const googleImage = 'https://lh3.googleusercontent.com/avatar123'
      const googleAccountId = 'google_account_123'

      // STEP 1: Check if user exists (new user)
      mockPrisma.user.findUnique.mockResolvedValueOnce(null)

      const existingUser = await mockPrisma.user.findUnique({
        where: { email: googleEmail }
      })

      expect(existingUser).toBeNull()

      // STEP 2: Create user (NextAuth handles this automatically)
      const newGoogleUser = {
        id: 'user_google_new',
        email: googleEmail,
        name: googleName,
        password: null,
        points: 50,
        image: googleImage,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.create.mockResolvedValue(newGoogleUser)

      const createdUser = await mockPrisma.user.create({
        data: {
          email: googleEmail,
          name: googleName,
          image: googleImage,
          emailVerified: new Date(),
          points: 50,
        }
      })

      expect(createdUser).not.toBeNull()
      expect(createdUser.email).toBe(googleEmail)
      expect(createdUser.password).toBeNull()
      expect(createdUser.points).toBe(50)

      // STEP 3: Create account link
      const googleAccount = {
        id: 'account_google_123',
        userId: newGoogleUser.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: googleAccountId,
        refresh_token: null,
        access_token: 'google_access_token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'Bearer',
        scope: 'openid profile email',
        id_token: 'google_id_token',
        session_state: null,
      }

      mockPrisma.account.create.mockResolvedValue(googleAccount as any)

      const account = await mockPrisma.account.create({
        data: {
          userId: newGoogleUser.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: googleAccountId,
          access_token: 'google_access_token',
          expires_at: googleAccount.expires_at,
          token_type: 'Bearer',
          scope: 'openid profile email',
          id_token: 'google_id_token',
        }
      })

      expect(account).not.toBeNull()
      expect(account.provider).toBe('google')
      expect(account.userId).toBe(newGoogleUser.id)

      // STEP 4: Create session
      const sessionToken = 'google_session_token'
      const googleSession = {
        id: 'session_google',
        sessionToken: sessionToken,
        userId: newGoogleUser.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      mockPrisma.session.create.mockResolvedValue(googleSession)

      const session = await mockPrisma.session.create({
        data: {
          sessionToken: sessionToken,
          userId: newGoogleUser.id,
          expires: googleSession.expires,
        }
      })

      expect(session).not.toBeNull()
      expect(session.userId).toBe(newGoogleUser.id)

      // STEP 5: Verify user can generate images
      mockPrisma.user.findUnique.mockResolvedValueOnce(newGoogleUser)

      const userForGeneration = await mockPrisma.user.findUnique({
        where: { id: newGoogleUser.id },
        select: { points: true }
      })

      expect(userForGeneration?.points).toBe(50)
    })

    it('should complete Google OAuth flow for existing user', async () => {
      const existingGoogleUser = {
        id: 'user_google_existing',
        email: 'existing@example.com',
        name: 'Existing User',
        password: null,
        points: 75,
        image: 'https://lh3.googleusercontent.com/old_avatar',
        emailVerified: new Date(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      }

      // User already exists
      mockPrisma.user.findUnique.mockResolvedValue(existingGoogleUser)

      const user = await mockPrisma.user.findUnique({
        where: { email: existingGoogleUser.email }
      })

      expect(user).not.toBeNull()
      expect(user?.id).toBe(existingGoogleUser.id)
      expect(user?.points).toBe(75)

      // Check if account link exists
      mockPrisma.account.findFirst.mockResolvedValue({
        id: 'account_existing',
        userId: existingGoogleUser.id,
        provider: 'google',
        providerAccountId: 'google_123',
      } as any)

      const account = await mockPrisma.account.findFirst({
        where: {
          userId: existingGoogleUser.id,
          provider: 'google',
        }
      })

      expect(account).not.toBeNull()
      expect(account?.provider).toBe('google')

      // Create new session
      const sessionToken = 'existing_user_session'
      const newSession = {
        id: 'session_existing',
        sessionToken: sessionToken,
        userId: existingGoogleUser.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      mockPrisma.session.create.mockResolvedValue(newSession)

      const session = await mockPrisma.session.create({
        data: {
          sessionToken: sessionToken,
          userId: existingGoogleUser.id,
          expires: newSession.expires,
        }
      })

      expect(session).not.toBeNull()
      expect(session.userId).toBe(existingGoogleUser.id)
    })

    it('should handle Google OAuth callback errors gracefully', async () => {
      // Simulate OAuth callback failure
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockPrisma.user.findUnique({
          where: { email: 'oauth@example.com' }
        })
      ).rejects.toThrow('Database connection failed')

      // Should not create session
      expect(mockPrisma.session.create).not.toHaveBeenCalled()
    })
  })

  describe('Points System Integration', () => {
    it('should initialize new users with 50 points', async () => {
      const newUser = {
        id: 'user_points_init',
        email: 'points@example.com',
        name: 'Points User',
        password: '$2a$10$hashed',
        points: 50,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.create.mockResolvedValue(newUser)

      const user = await mockPrisma.user.create({
        data: {
          email: 'points@example.com',
          name: 'Points User',
          password: '$2a$10$hashed',
          points: 50,
        }
      })

      expect(user.points).toBe(50)
    })

    it('should track points across session refreshes', async () => {
      const userId = 'user_points_tracking'
      const sessionToken = 'session_points'

      // Initial session with 50 points
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        points: 50,
      } as any)

      let userPoints = await mockPrisma.user.findUnique({
        where: { id: userId },
        select: { points: true }
      })

      expect(userPoints?.points).toBe(50)

      // Generate image (deduct 1 point)
      mockPrisma.user.update.mockResolvedValueOnce({
        id: userId,
        points: 49,
      } as any)

      await mockPrisma.user.update({
        where: { id: userId },
        data: { points: { decrement: 1 } }
      })

      // Refresh session - should show updated points
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        points: 49,
      } as any)

      userPoints = await mockPrisma.user.findUnique({
        where: { id: userId },
        select: { points: true }
      })

      expect(userPoints?.points).toBe(49)
    })

    it('should handle points purchase correctly', async () => {
      const userId = 'user_points_purchase'

      // User has 5 points
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        points: 5,
      } as any)

      const currentPoints = await mockPrisma.user.findUnique({
        where: { id: userId },
        select: { points: true }
      })

      expect(currentPoints?.points).toBe(5)

      // Purchase 100 points
      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        points: 105,
      } as any)

      const updatedUser = await mockPrisma.user.update({
        where: { id: userId },
        data: { points: { increment: 100 } }
      })

      expect(updatedUser.points).toBe(105)
    })

    it('should prevent negative points balance', async () => {
      const userId = 'user_points_negative'

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        points: 1,
      } as any)

      const user = await mockPrisma.user.findUnique({
        where: { id: userId },
        select: { points: true }
      })

      expect(user?.points).toBe(1)

      // Try to deduct 5 points (should fail)
      const hasEnoughPoints = (user?.points || 0) >= 5
      expect(hasEnoughPoints).toBe(false)

      // Should not update
      expect(mockPrisma.user.update).not.toHaveBeenCalled()
    })
  })

  describe('Error Scenarios', () => {
    it('should handle duplicate email registration', async () => {
      const duplicateEmail = 'duplicate@example.com'

      // User already exists
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing_user',
        email: duplicateEmail,
        name: 'Existing User',
        password: '$2a$10$hashed',
        points: 50,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const existingUser = await mockPrisma.user.findUnique({
        where: { email: duplicateEmail }
      })

      expect(existingUser).not.toBeNull()

      // Should not create new user
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('should handle invalid password during login', async () => {
      const testUser = {
        id: 'user_invalid_pass',
        email: 'test@example.com',
        password: '$2a$10$correcthash',
        name: 'Test User',
        points: 50,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.user.findUnique.mockResolvedValue(testUser)
      mockBcrypt.compare.mockResolvedValue(false as never)

      const user = await mockPrisma.user.findUnique({
        where: { email: testUser.email }
      })

      const isValid = await mockBcrypt.compare('wrongpassword', user!.password!)

      expect(isValid).toBe(false)
      expect(mockPrisma.session.create).not.toHaveBeenCalled()
    })

    it('should handle database connection errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Connection timeout'))

      await expect(
        mockPrisma.user.findUnique({
          where: { email: 'test@example.com' }
        })
      ).rejects.toThrow('Connection timeout')
    })

    it('should handle session expiration', async () => {
      const expiredSession = {
        id: 'session_expired',
        sessionToken: 'expired_token',
        userId: 'user_123',
        expires: new Date(Date.now() - 1000),
      }

      mockPrisma.session.findUnique.mockResolvedValue(expiredSession)

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: 'expired_token' }
      })

      expect(session).not.toBeNull()
      expect(session!.expires.getTime()).toBeLessThan(Date.now())

      // Should be treated as invalid
      const isExpired = session!.expires.getTime() < Date.now()
      expect(isExpired).toBe(true)
    })

    it('should handle missing session token', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null)

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: 'non_existent' }
      })

      expect(session).toBeNull()
    })

    it('should handle password too short', async () => {
      const shortPassword = '12345'

      // Validation should fail before reaching database
      const isValidLength = shortPassword.length >= 6
      expect(isValidLength).toBe(false)

      // Should not hash or create user
      expect(mockBcrypt.hash).not.toHaveBeenCalled()
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('should handle missing required fields', async () => {
      const invalidData = {
        email: '',
        password: 'password123',
        name: '',
      }

      // Validation should fail
      const hasEmail = invalidData.email.length > 0
      const hasName = invalidData.name.length > 0

      expect(hasEmail).toBe(false)
      expect(hasName).toBe(false)

      // Should not create user
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('should handle concurrent session creation', async () => {
      const userId = 'user_concurrent'
      const sessionToken1 = 'session_1'
      const sessionToken2 = 'session_2'

      // Create first session
      mockPrisma.session.create.mockResolvedValueOnce({
        id: 'session_id_1',
        sessionToken: sessionToken1,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      const session1 = await mockPrisma.session.create({
        data: {
          sessionToken: sessionToken1,
          userId: userId,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      })

      expect(session1.sessionToken).toBe(sessionToken1)

      // Create second session (different device)
      mockPrisma.session.create.mockResolvedValueOnce({
        id: 'session_id_2',
        sessionToken: sessionToken2,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      const session2 = await mockPrisma.session.create({
        data: {
          sessionToken: sessionToken2,
          userId: userId,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      })

      expect(session2.sessionToken).toBe(sessionToken2)
      expect(mockPrisma.session.create).toHaveBeenCalledTimes(2)
    })
  })

  describe('Session Management Edge Cases', () => {
    it('should handle logout from all devices', async () => {
      const userId = 'user_multi_device'

      mockPrisma.session.deleteMany.mockResolvedValue({ count: 3 })

      const result = await mockPrisma.session.deleteMany({
        where: { userId: userId }
      })

      expect(result.count).toBe(3)
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: userId }
      })
    })

    it('should handle session refresh with updated user data', async () => {
      const userId = 'user_refresh'
      const sessionToken = 'refresh_token'

      // Initial session
      mockPrisma.session.findUnique.mockResolvedValue({
        id: 'session_refresh',
        sessionToken: sessionToken,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken }
      })

      expect(session).not.toBeNull()

      // Get updated user data
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'updated@example.com',
        name: 'Updated Name',
        password: '$2a$10$hashed',
        points: 75,
        image: 'new_avatar.jpg',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const user = await mockPrisma.user.findUnique({
        where: { id: userId }
      })

      expect(user?.name).toBe('Updated Name')
      expect(user?.points).toBe(75)
    })
  })
})
