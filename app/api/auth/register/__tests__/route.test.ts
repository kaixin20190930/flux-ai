import { POST } from '../route'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { describe, it, expect, beforeEach } from '@jest/globals'

// Mock NextResponse
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server')
  return {
    ...actual,
    NextResponse: {
      json: (data: any, init?: any) => {
        const response = {
          status: init?.status || 200,
          json: async () => data,
          headers: new Headers(init?.headers || {}),
        }
        return response
      },
    },
  }
})

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

// Helper function to create a mock NextRequest
function createMockRequest(body: any): NextRequest {
  const request = {
    json: jest.fn().mockResolvedValue(body),
    headers: new Headers(),
    method: 'POST',
    url: 'http://localhost:3000/api/auth/register',
  } as unknown as NextRequest
  
  return request
}

describe('POST /api/auth/register', () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Successful registration with valid data', () => {
    it('should create a new user with valid name, email, and password', async () => {
      const validUserData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      }

      const hashedPassword = 'hashed_password_123'
      const createdUser = {
        id: 'user_123',
        name: validUserData.name,
        email: validUserData.email,
        password: hashedPassword,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never)
      mockPrisma.user.create.mockResolvedValue(createdUser)

      const request = createMockRequest(validUserData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toEqual({
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
      })
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validUserData.email },
      })
      expect(mockBcrypt.hash).toHaveBeenCalledWith(validUserData.password, 10)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: validUserData.name,
          email: validUserData.email,
          password: hashedPassword,
          points: 50,
        },
      })
    })

    it('should return user data without password in response', async () => {
      const validUserData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'securepass',
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue('hashed_password' as never)
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_456',
        name: validUserData.name,
        email: validUserData.email,
        password: 'hashed_password',
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
      })

      const request = createMockRequest(validUserData)
      const response = await POST(request)
      const data = await response.json()

      expect(data.user).not.toHaveProperty('password')
      expect(data.user).toHaveProperty('id')
      expect(data.user).toHaveProperty('name')
      expect(data.user).toHaveProperty('email')
    })
  })

  describe('Duplicate email error handling', () => {
    it('should return 409 error when email already exists', async () => {
      const duplicateUserData = {
        name: 'Duplicate User',
        email: 'existing@example.com',
        password: 'password123',
      }

      const existingUser = {
        id: 'existing_user_id',
        name: 'Existing User',
        email: duplicateUserData.email,
        password: 'hashed_password',
        points: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
      }

      mockPrisma.user.findUnique.mockResolvedValue(existingUser)

      const request = createMockRequest(duplicateUserData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Email already registered')
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: duplicateUserData.email },
      })
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('should not create user when email is already taken', async () => {
      const duplicateUserData = {
        name: 'Another User',
        email: 'taken@example.com',
        password: 'password456',
      }

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user_789',
        name: 'Original User',
        email: duplicateUserData.email,
        password: 'hashed',
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
      })

      const request = createMockRequest(duplicateUserData)
      await POST(request)

      expect(mockBcrypt.hash).not.toHaveBeenCalled()
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })
  })

  describe('Password validation (minimum 6 characters)', () => {
    it('should reject password with less than 6 characters', async () => {
      const shortPasswordData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '12345', // Only 5 characters
      }

      const request = createMockRequest(shortPasswordData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password must be at least 6 characters')
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('should accept password with exactly 6 characters', async () => {
      const validPasswordData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123456', // Exactly 6 characters
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue('hashed_password' as never)
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_min_pass',
        name: validPasswordData.name,
        email: validPasswordData.email,
        password: 'hashed_password',
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
      })

      const request = createMockRequest(validPasswordData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should accept password with more than 6 characters', async () => {
      const validPasswordData = {
        name: 'Test User',
        email: 'test2@example.com',
        password: 'verylongpassword123',
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue('hashed_password' as never)
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_long_pass',
        name: validPasswordData.name,
        email: validPasswordData.email,
        password: 'hashed_password',
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
      })

      const request = createMockRequest(validPasswordData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Initial points allocation (50 points)', () => {
    it('should allocate exactly 50 points to new user', async () => {
      const newUserData = {
        name: 'Points Test User',
        email: 'points@example.com',
        password: 'password123',
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue('hashed_password' as never)
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_points',
        name: newUserData.name,
        email: newUserData.email,
        password: 'hashed_password',
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
      })

      const request = createMockRequest(newUserData)
      await POST(request)

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          points: 50,
        }),
      })
    })

    it('should verify points are set during user creation', async () => {
      const newUserData = {
        name: 'Another Points User',
        email: 'points2@example.com',
        password: 'password456',
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue('hashed_password' as never)
      
      let capturedUserData: any = null
      mockPrisma.user.create.mockImplementation((args) => {
        capturedUserData = args.data
        return Promise.resolve({
          id: 'user_points_2',
          name: args.data.name,
          email: args.data.email,
          password: args.data.password,
          points: args.data.points,
          createdAt: new Date(),
          updatedAt: new Date(),
          emailVerified: null,
          image: null,
        })
      })

      const request = createMockRequest(newUserData)
      await POST(request)

      expect(capturedUserData).not.toBeNull()
      expect(capturedUserData.points).toBe(50)
    })
  })

  describe('Missing required fields validation', () => {
    it('should return 400 error when name is missing', async () => {
      const missingNameData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const request = createMockRequest(missingNameData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })

    it('should return 400 error when email is missing', async () => {
      const missingEmailData = {
        name: 'Test User',
        password: 'password123',
      }

      const request = createMockRequest(missingEmailData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })

    it('should return 400 error when password is missing', async () => {
      const missingPasswordData = {
        name: 'Test User',
        email: 'test@example.com',
      }

      const request = createMockRequest(missingPasswordData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })
  })

  describe('Password hashing', () => {
    it('should hash password with bcrypt before storing', async () => {
      const userData = {
        name: 'Hash Test User',
        email: 'hash@example.com',
        password: 'plainpassword',
      }

      const hashedPassword = 'bcrypt_hashed_password'

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never)
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_hash',
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
      })

      const request = createMockRequest(userData)
      await POST(request)

      expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 10)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          password: hashedPassword,
        }),
      })
    })

    it('should use bcrypt with 10 rounds', async () => {
      const userData = {
        name: 'Rounds Test User',
        email: 'rounds@example.com',
        password: 'testpassword',
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue('hashed' as never)
      mockPrisma.user.create.mockResolvedValue({
        id: 'user_rounds',
        name: userData.name,
        email: userData.email,
        password: 'hashed',
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
      })

      const request = createMockRequest(userData)
      await POST(request)

      expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 10)
    })
  })
})
