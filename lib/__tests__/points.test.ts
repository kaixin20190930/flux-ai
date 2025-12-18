/**
 * Tests for Points Management Utilities
 * 
 * These tests verify the core functionality of the points management system.
 * Requirements: 8.2, 8.3, 8.4, 8.5
 */

import { getUserPoints, deductPoints, addPoints } from '../points'
import { prisma } from '../prisma'

// Mock the Prisma client
jest.mock('../prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('Points Management Utilities', () => {
  const mockUserId = 'test-user-123'
  const mockPrisma = prisma as jest.Mocked<typeof prisma>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserPoints', () => {
    it('should return user points when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        points: 100,
      } as any)

      const points = await getUserPoints(mockUserId)

      expect(points).toBe(100)
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: { points: true },
      })
    })

    it('should return null when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const points = await getUserPoints(mockUserId)

      expect(points).toBeNull()
    })

    it('should throw error when database query fails', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

      await expect(getUserPoints(mockUserId)).rejects.toThrow('Failed to fetch user points')
    })
  })

  describe('deductPoints', () => {
    it('should deduct points successfully when user has sufficient balance', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        points: 100,
      } as any)

      mockPrisma.user.update.mockResolvedValue({
        id: mockUserId,
        points: 90,
      } as any)

      const newBalance = await deductPoints(mockUserId, 10)

      expect(newBalance).toBe(90)
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { points: { decrement: 10 } },
        select: { points: true },
      })
    })

    it('should throw error when amount is zero or negative', async () => {
      await expect(deductPoints(mockUserId, 0)).rejects.toThrow('Amount to deduct must be positive')
      await expect(deductPoints(mockUserId, -5)).rejects.toThrow('Amount to deduct must be positive')
    })

    it('should throw error when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(deductPoints(mockUserId, 10)).rejects.toThrow('User not found')
    })

    it('should throw error when user has insufficient points', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        points: 5,
      } as any)

      await expect(deductPoints(mockUserId, 10)).rejects.toThrow('Insufficient points')
    })
  })

  describe('addPoints', () => {
    it('should add points successfully', async () => {
      mockPrisma.user.update.mockResolvedValue({
        id: mockUserId,
        points: 150,
      } as any)

      const newBalance = await addPoints(mockUserId, 50)

      expect(newBalance).toBe(150)
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { points: { increment: 50 } },
        select: { points: true },
      })
    })

    it('should throw error when amount is zero or negative', async () => {
      await expect(addPoints(mockUserId, 0)).rejects.toThrow('Amount to add must be positive')
      await expect(addPoints(mockUserId, -10)).rejects.toThrow('Amount to add must be positive')
    })

    it('should throw error when database update fails', async () => {
      mockPrisma.user.update.mockRejectedValue(new Error('Database error'))

      await expect(addPoints(mockUserId, 50)).rejects.toThrow('Failed to add points')
    })
  })
})
