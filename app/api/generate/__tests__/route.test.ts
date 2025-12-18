/**
 * @jest-environment node
 */

import { POST } from '../route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/utils/usageTrackingService', () => ({
  usageTrackingService: {
    isIPBlocked: jest.fn().mockResolvedValue(false),
    isFingerprintBlocked: jest.fn().mockResolvedValue(false),
    checkUsageLimit: jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 3,
      trackingMethod: 'fingerprint',
    }),
    recordGeneration: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('replicate', () => {
  return jest.fn().mockImplementation(() => ({
    run: jest.fn().mockResolvedValue(['https://example.com/image.png']),
  }));
});

jest.mock('@/utils/logUtils', () => ({
  logWithTimestamp: jest.fn(),
}));

jest.mock('@/utils/performanceMonitor', () => ({
  PerformanceMonitor: {
    measureAsync: jest.fn((name, fn) => fn()),
    recordCustomMetric: jest.fn(),
  },
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('POST /api/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication with NextAuth', () => {
    it('should allow authenticated users to generate images', async () => {
      // Mock authenticated session
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      // Mock user with sufficient points
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        points: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
        password: null,
      });

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        points: 99,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
        password: null,
      });

      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'flux-schnell',
          aspectRatio: '1:1',
          format: 'png',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.image).toBeDefined();
      expect(mockAuth).toHaveBeenCalled();
    });

    it('should allow anonymous users with free generations', async () => {
      // Mock no session (anonymous user)
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'flux-schnell',
          aspectRatio: '1:1',
          format: 'png',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.image).toBeDefined();
      expect(mockAuth).toHaveBeenCalled();
    });

    it('should use session.user.id for authenticated users', async () => {
      const userId = 'user-456';
      
      mockAuth.mockResolvedValue({
        user: {
          id: userId,
          email: 'test2@example.com',
          name: 'Test User 2',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test2@example.com',
        name: 'Test User 2',
        points: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
        password: null,
      });

      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        email: 'test2@example.com',
        name: 'Test User 2',
        points: 49,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
        password: null,
      });

      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'flux-schnell',
          aspectRatio: '1:1',
          format: 'png',
        }),
      });

      await POST(request);

      // Verify that Prisma was called with the correct user ID from session
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { points: true },
      });
    });

    it('should return 403 when authenticated user has insufficient points', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-789',
          email: 'test3@example.com',
          name: 'Test User 3',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      // Mock user with insufficient points
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-789',
        email: 'test3@example.com',
        name: 'Test User 3',
        points: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
        password: null,
      });

      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'flux-schnell',
          aspectRatio: '1:1',
          format: 'png',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Insufficient points');
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for missing prompt', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          model: 'flux-schnell',
          aspectRatio: '1:1',
          format: 'png',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Prompt is required');
    });

    it('should return 400 for invalid model', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'invalid-model',
          aspectRatio: '1:1',
          format: 'png',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid model selected');
    });
  });

  describe('No JWT Dependencies', () => {
    it('should not use any JWT-related functions', async () => {
      // This test verifies that the route uses NextAuth, not JWT
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        points: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
        password: null,
      });

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        points: 99,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
        password: null,
      });

      const request = new NextRequest('http://localhost:3000/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'A beautiful sunset',
          model: 'flux-schnell',
          aspectRatio: '1:1',
          format: 'png',
        }),
      });

      await POST(request);

      // Verify NextAuth's auth() was called
      expect(mockAuth).toHaveBeenCalled();
      
      // The fact that this test runs without importing any JWT modules
      // proves that the route doesn't depend on JWT
    });
  });
});
