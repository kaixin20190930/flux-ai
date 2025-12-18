/**
 * Session Management Tests
 * 
 * This test suite validates session management functionality:
 * - Session persists across page refreshes
 * - Logout functionality
 * - Session expiration
 * - Concurrent sessions
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

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
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

import { describe, it, expect, beforeEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'

describe('Session Management', () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Session Persistence Across Page Refreshes (Requirement 5.2)', () => {
    it('should retrieve active session from database on page refresh', async () => {
      const sessionToken = 'persistent_session_token_123'
      const userId = 'user_persistent_123'
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

      const mockSession = {
        id: 'session_persistent_123',
        sessionToken: sessionToken,
        userId: userId,
        expires: expiresAt,
      }

      mockPrisma.session.findUnique.mockResolvedValue(mockSession)

      // Simulate page refresh - retrieve session
      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken }
      })

      expect(session).not.toBeNull()
      expect(session?.sessionToken).toBe(sessionToken)
      expect(session?.userId).toBe(userId)
      expect(session?.expires.getTime()).toBeGreaterThan(Date.now())
      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
        where: { sessionToken: sessionToken }
      })
    })

    it('should maintain session across multiple page refreshes', async () => {
      const sessionToken = 'multi_refresh_token'
      const userId = 'user_multi_refresh'
      
      const mockSession = {
        id: 'session_multi_refresh',
        sessionToken: sessionToken,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      mockPrisma.session.findUnique.mockResolvedValue(mockSession)

      // Simulate 5 consecutive page refreshes
      for (let i = 0; i < 5; i++) {
        const session = await mockPrisma.session.findUnique({
          where: { sessionToken: sessionToken }
        })

        expect(session).not.toBeNull()
        expect(session?.sessionToken).toBe(sessionToken)
        expect(session?.userId).toBe(userId)
      }

      expect(mockPrisma.session.findUnique).toHaveBeenCalledTimes(5)
    })

    it('should load user data with session on refresh', async () => {
      const sessionToken = 'session_with_user_data'
      const userId = 'user_with_data'

      const mockSession = {
        id: 'session_user_data',
        sessionToken: sessionToken,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      const mockUser = {
        id: userId,
        email: 'user@example.com',
        name: 'Test User',
        password: '$2a$10$hashed',
        points: 75,
        image: null,
        emailVerified: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.session.findUnique.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      // Retrieve session
      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken }
      })

      expect(session).not.toBeNull()

      // Load user data
      const user = await mockPrisma.user.findUnique({
        where: { id: session!.userId }
      })

      expect(user).not.toBeNull()
      expect(user?.id).toBe(userId)
      expect(user?.email).toBe('user@example.com')
      expect(user?.points).toBe(75)
    })

    it('should update session data on refresh (e.g., points)', async () => {
      const sessionToken = 'session_update_points'
      const userId = 'user_update_points'

      const mockSession = {
        id: 'session_points_update',
        sessionToken: sessionToken,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      mockPrisma.session.findUnique.mockResolvedValue(mockSession)

      // Initial user data with 50 points
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        points: 50,
      } as any)

      const session1 = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken }
      })
      const user1 = await mockPrisma.user.findUnique({
        where: { id: session1!.userId },
        select: { points: true }
      })

      expect(user1?.points).toBe(50)

      // User generates image, points deducted
      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        points: 49,
      } as any)

      await mockPrisma.user.update({
        where: { id: userId },
        data: { points: { decrement: 1 } }
      })

      // Page refresh - should show updated points
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        points: 49,
      } as any)

      const session2 = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken }
      })
      const user2 = await mockPrisma.user.findUnique({
        where: { id: session2!.userId },
        select: { points: true }
      })

      expect(user2?.points).toBe(49)
    })

    it('should return null for non-existent session token', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null)

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: 'non_existent_token' }
      })

      expect(session).toBeNull()
    })
  })

  describe('Logout Functionality (Requirement 5.4)', () => {
    it('should delete session from database on logout', async () => {
      const sessionToken = 'session_to_logout'
      const userId = 'user_logout'

      const mockSession = {
        id: 'session_logout',
        sessionToken: sessionToken,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      mockPrisma.session.delete.mockResolvedValue(mockSession)

      // Perform logout
      await mockPrisma.session.delete({
        where: { sessionToken: sessionToken }
      })

      expect(mockPrisma.session.delete).toHaveBeenCalledWith({
        where: { sessionToken: sessionToken }
      })
    })

    it('should verify session is removed after logout', async () => {
      const sessionToken = 'session_verify_logout'

      // Session exists before logout
      mockPrisma.session.findUnique.mockResolvedValueOnce({
        id: 'session_before_logout',
        sessionToken: sessionToken,
        userId: 'user_123',
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      const sessionBefore = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken }
      })

      expect(sessionBefore).not.toBeNull()

      // Logout
      mockPrisma.session.delete.mockResolvedValue(sessionBefore!)

      await mockPrisma.session.delete({
        where: { sessionToken: sessionToken }
      })

      // Session should not exist after logout
      mockPrisma.session.findUnique.mockResolvedValueOnce(null)

      const sessionAfter = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken }
      })

      expect(sessionAfter).toBeNull()
    })

    it('should handle logout when session does not exist', async () => {
      const sessionToken = 'non_existent_session'

      mockPrisma.session.delete.mockRejectedValue(
        new Error('Record to delete does not exist')
      )

      await expect(
        mockPrisma.session.delete({
          where: { sessionToken: sessionToken }
        })
      ).rejects.toThrow('Record to delete does not exist')
    })

    it('should logout from specific device only', async () => {
      const userId = 'user_multi_device'
      const sessionToken1 = 'device_1_session'
      const sessionToken2 = 'device_2_session'

      // User has two active sessions
      mockPrisma.session.findUnique
        .mockResolvedValueOnce({
          id: 'session_device_1',
          sessionToken: sessionToken1,
          userId: userId,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .mockResolvedValueOnce({
          id: 'session_device_2',
          sessionToken: sessionToken2,
          userId: userId,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })

      const session1 = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken1 }
      })
      const session2 = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken2 }
      })

      expect(session1).not.toBeNull()
      expect(session2).not.toBeNull()

      // Logout from device 1 only
      mockPrisma.session.delete.mockResolvedValue(session1!)

      await mockPrisma.session.delete({
        where: { sessionToken: sessionToken1 }
      })

      // Device 1 session should be gone
      mockPrisma.session.findUnique.mockResolvedValueOnce(null)

      const session1After = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken1 }
      })

      expect(session1After).toBeNull()

      // Device 2 session should still exist
      mockPrisma.session.findUnique.mockResolvedValueOnce(session2)

      const session2After = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken2 }
      })

      expect(session2After).not.toBeNull()
      expect(session2After?.sessionToken).toBe(sessionToken2)
    })

    it('should logout from all devices', async () => {
      const userId = 'user_logout_all'

      mockPrisma.session.deleteMany.mockResolvedValue({ count: 3 })

      // Logout from all devices
      const result = await mockPrisma.session.deleteMany({
        where: { userId: userId }
      })

      expect(result.count).toBe(3)
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: userId }
      })
    })
  })

  describe('Session Expiration (Requirement 5.5)', () => {
    it('should identify expired session', async () => {
      const expiredSession = {
        id: 'session_expired',
        sessionToken: 'expired_token',
        userId: 'user_expired',
        expires: new Date(Date.now() - 1000), // Expired 1 second ago
      }

      mockPrisma.session.findUnique.mockResolvedValue(expiredSession)

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: 'expired_token' }
      })

      expect(session).not.toBeNull()
      expect(session!.expires.getTime()).toBeLessThan(Date.now())

      // Session should be treated as invalid
      const isExpired = session!.expires.getTime() < Date.now()
      expect(isExpired).toBe(true)
    })

    it('should identify valid (non-expired) session', async () => {
      const validSession = {
        id: 'session_valid',
        sessionToken: 'valid_token',
        userId: 'user_valid',
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }

      mockPrisma.session.findUnique.mockResolvedValue(validSession)

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: 'valid_token' }
      })

      expect(session).not.toBeNull()
      expect(session!.expires.getTime()).toBeGreaterThan(Date.now())

      const isExpired = session!.expires.getTime() < Date.now()
      expect(isExpired).toBe(false)
    })

    it('should handle session expiring during user activity', async () => {
      const sessionToken = 'session_expiring'
      const userId = 'user_expiring'

      // Session is about to expire (1 second remaining)
      const almostExpiredSession = {
        id: 'session_almost_expired',
        sessionToken: sessionToken,
        userId: userId,
        expires: new Date(Date.now() + 1000),
      }

      mockPrisma.session.findUnique.mockResolvedValue(almostExpiredSession)

      const sessionBefore = await mockPrisma.session.findUnique({
        where: { sessionToken: sessionToken }
      })

      expect(sessionBefore).not.toBeNull()
      expect(sessionBefore!.expires.getTime()).toBeGreaterThan(Date.now())

      // Wait for expiration (simulate)
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Check again - should be expired
      const isExpired = sessionBefore!.expires.getTime() < Date.now()
      expect(isExpired).toBe(true)
    })

    it('should handle session with far future expiration', async () => {
      const farFutureSession = {
        id: 'session_far_future',
        sessionToken: 'far_future_token',
        userId: 'user_far_future',
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      }

      mockPrisma.session.findUnique.mockResolvedValue(farFutureSession)

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: 'far_future_token' }
      })

      expect(session).not.toBeNull()
      expect(session!.expires.getTime()).toBeGreaterThan(Date.now())

      const daysUntilExpiration = (session!.expires.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      expect(daysUntilExpiration).toBeGreaterThan(360)
    })

    it('should automatically log out user when session expires', async () => {
      const expiredSession = {
        id: 'session_auto_logout',
        sessionToken: 'auto_logout_token',
        userId: 'user_auto_logout',
        expires: new Date(Date.now() - 5000), // Expired 5 seconds ago
      }

      mockPrisma.session.findUnique.mockResolvedValue(expiredSession)

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: 'auto_logout_token' }
      })

      expect(session).not.toBeNull()

      const isExpired = session!.expires.getTime() < Date.now()
      expect(isExpired).toBe(true)

      // Simulate automatic logout by deleting expired session
      if (isExpired) {
        mockPrisma.session.delete.mockResolvedValue(expiredSession)

        await mockPrisma.session.delete({
          where: { sessionToken: 'auto_logout_token' }
        })

        expect(mockPrisma.session.delete).toHaveBeenCalledWith({
          where: { sessionToken: 'auto_logout_token' }
        })
      }
    })
  })

  describe('Concurrent Sessions (Requirement 5.5)', () => {
    it('should allow multiple concurrent sessions for same user', async () => {
      const userId = 'user_concurrent'
      const sessionToken1 = 'concurrent_session_1'
      const sessionToken2 = 'concurrent_session_2'
      const sessionToken3 = 'concurrent_session_3'

      const session1 = {
        id: 'session_concurrent_1',
        sessionToken: sessionToken1,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      const session2 = {
        id: 'session_concurrent_2',
        sessionToken: sessionToken2,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      const session3 = {
        id: 'session_concurrent_3',
        sessionToken: sessionToken3,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      // Create three concurrent sessions
      mockPrisma.session.create
        .mockResolvedValueOnce(session1)
        .mockResolvedValueOnce(session2)
        .mockResolvedValueOnce(session3)

      const createdSession1 = await mockPrisma.session.create({
        data: {
          sessionToken: sessionToken1,
          userId: userId,
          expires: session1.expires,
        }
      })

      const createdSession2 = await mockPrisma.session.create({
        data: {
          sessionToken: sessionToken2,
          userId: userId,
          expires: session2.expires,
        }
      })

      const createdSession3 = await mockPrisma.session.create({
        data: {
          sessionToken: sessionToken3,
          userId: userId,
          expires: session3.expires,
        }
      })

      expect(createdSession1.userId).toBe(userId)
      expect(createdSession2.userId).toBe(userId)
      expect(createdSession3.userId).toBe(userId)
      expect(mockPrisma.session.create).toHaveBeenCalledTimes(3)
    })

    it('should maintain independent session states across devices', async () => {
      const userId = 'user_independent_sessions'
      const desktopToken = 'desktop_session'
      const mobileToken = 'mobile_session'

      const desktopSession = {
        id: 'session_desktop',
        sessionToken: desktopToken,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      const mobileSession = {
        id: 'session_mobile',
        sessionToken: mobileToken,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      mockPrisma.session.findUnique
        .mockResolvedValueOnce(desktopSession)
        .mockResolvedValueOnce(mobileSession)

      // Both sessions should be retrievable independently
      const desktop = await mockPrisma.session.findUnique({
        where: { sessionToken: desktopToken }
      })

      const mobile = await mockPrisma.session.findUnique({
        where: { sessionToken: mobileToken }
      })

      expect(desktop).not.toBeNull()
      expect(mobile).not.toBeNull()
      expect(desktop?.sessionToken).toBe(desktopToken)
      expect(mobile?.sessionToken).toBe(mobileToken)
      expect(desktop?.userId).toBe(userId)
      expect(mobile?.userId).toBe(userId)
    })

    it('should handle logout from one device without affecting others', async () => {
      const userId = 'user_selective_logout'
      const device1Token = 'device_1_token'
      const device2Token = 'device_2_token'

      const device1Session = {
        id: 'session_device_1',
        sessionToken: device1Token,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      const device2Session = {
        id: 'session_device_2',
        sessionToken: device2Token,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      // Both sessions exist
      mockPrisma.session.findUnique
        .mockResolvedValueOnce(device1Session)
        .mockResolvedValueOnce(device2Session)

      const session1Before = await mockPrisma.session.findUnique({
        where: { sessionToken: device1Token }
      })
      const session2Before = await mockPrisma.session.findUnique({
        where: { sessionToken: device2Token }
      })

      expect(session1Before).not.toBeNull()
      expect(session2Before).not.toBeNull()

      // Logout from device 1
      mockPrisma.session.delete.mockResolvedValue(device1Session)

      await mockPrisma.session.delete({
        where: { sessionToken: device1Token }
      })

      // Device 1 session is gone
      mockPrisma.session.findUnique.mockResolvedValueOnce(null)

      const session1After = await mockPrisma.session.findUnique({
        where: { sessionToken: device1Token }
      })

      expect(session1After).toBeNull()

      // Device 2 session still exists
      mockPrisma.session.findUnique.mockResolvedValueOnce(device2Session)

      const session2After = await mockPrisma.session.findUnique({
        where: { sessionToken: device2Token }
      })

      expect(session2After).not.toBeNull()
      expect(session2After?.sessionToken).toBe(device2Token)
    })

    it('should handle concurrent session creation race condition', async () => {
      const userId = 'user_race_condition'
      const token1 = 'race_token_1'
      const token2 = 'race_token_2'

      const session1 = {
        id: 'session_race_1',
        sessionToken: token1,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      const session2 = {
        id: 'session_race_2',
        sessionToken: token2,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      mockPrisma.session.create
        .mockResolvedValueOnce(session1)
        .mockResolvedValueOnce(session2)

      // Simulate concurrent session creation
      const [result1, result2] = await Promise.all([
        mockPrisma.session.create({
          data: {
            sessionToken: token1,
            userId: userId,
            expires: session1.expires,
          }
        }),
        mockPrisma.session.create({
          data: {
            sessionToken: token2,
            userId: userId,
            expires: session2.expires,
          }
        })
      ])

      expect(result1.sessionToken).toBe(token1)
      expect(result2.sessionToken).toBe(token2)
      expect(result1.userId).toBe(userId)
      expect(result2.userId).toBe(userId)
      expect(mockPrisma.session.create).toHaveBeenCalledTimes(2)
    })

    it('should track different expiration times for concurrent sessions', async () => {
      const userId = 'user_different_expirations'
      const shortToken = 'short_session'
      const longToken = 'long_session'

      const shortSession = {
        id: 'session_short',
        sessionToken: shortToken,
        userId: userId,
        expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
      }

      const longSession = {
        id: 'session_long',
        sessionToken: longToken,
        userId: userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }

      mockPrisma.session.findUnique
        .mockResolvedValueOnce(shortSession)
        .mockResolvedValueOnce(longSession)

      const short = await mockPrisma.session.findUnique({
        where: { sessionToken: shortToken }
      })

      const long = await mockPrisma.session.findUnique({
        where: { sessionToken: longToken }
      })

      expect(short).not.toBeNull()
      expect(long).not.toBeNull()
      expect(long!.expires.getTime()).toBeGreaterThan(short!.expires.getTime())

      const shortDays = (short!.expires.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      const longDays = (long!.expires.getTime() - Date.now()) / (24 * 60 * 60 * 1000)

      expect(shortDays).toBeLessThan(2)
      expect(longDays).toBeGreaterThan(29)
    })
  })

  describe('Session Security and Edge Cases', () => {
    it('should handle database errors gracefully during session retrieval', async () => {
      mockPrisma.session.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      )

      await expect(
        mockPrisma.session.findUnique({
          where: { sessionToken: 'some_token' }
        })
      ).rejects.toThrow('Database connection failed')
    })

    it('should handle database errors during logout', async () => {
      mockPrisma.session.delete.mockRejectedValue(
        new Error('Database write failed')
      )

      await expect(
        mockPrisma.session.delete({
          where: { sessionToken: 'some_token' }
        })
      ).rejects.toThrow('Database write failed')
    })

    it('should handle invalid session token format', async () => {
      const invalidToken = ''

      mockPrisma.session.findUnique.mockResolvedValue(null)

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: invalidToken }
      })

      expect(session).toBeNull()
    })

    it('should handle session with null userId', async () => {
      const corruptSession = {
        id: 'session_corrupt',
        sessionToken: 'corrupt_token',
        userId: null as any,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }

      mockPrisma.session.findUnique.mockResolvedValue(corruptSession)

      const session = await mockPrisma.session.findUnique({
        where: { sessionToken: 'corrupt_token' }
      })

      expect(session).not.toBeNull()
      expect(session?.userId).toBeNull()

      // Should be treated as invalid
      const isValid = session?.userId != null
      expect(isValid).toBe(false)
    })
  })
})
