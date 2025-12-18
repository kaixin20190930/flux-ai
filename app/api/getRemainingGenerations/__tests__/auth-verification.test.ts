/**
 * Authentication verification tests for getRemainingGenerations endpoint
 * 
 * These tests verify that the endpoint correctly uses NextAuth for authentication
 * and returns consistent responses for authenticated and unauthenticated requests.
 * 
 * Requirements: 7.1, 7.2, 8.1, 8.3, 8.4
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';
import { auth } from '@/lib/auth';
import { usageTrackingService } from '@/utils/usageTrackingService';
import { securePointsService } from '@/utils/securePointsService';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/utils/usageTrackingService');
jest.mock('@/utils/securePointsService');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockUsageTrackingService = usageTrackingService as jest.Mocked<typeof usageTrackingService>;
const mockSecurePointsService = securePointsService as jest.Mocked<typeof securePointsService>;

describe('GET /api/getRemainingGenerations - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUsageTrackingService.isIPBlocked.mockResolvedValue(false);
    mockUsageTrackingService.isFingerprintBlocked.mockResolvedValue(false);
    mockUsageTrackingService.checkUsageLimit.mockResolvedValue({
      allowed: true,
      remaining: 3,
      trackingMethod: 'fingerprint',
      details: {}
    });
  });

  describe('Unauthenticated requests', () => {
    it('should return data for unauthenticated users', async () => {
      // Mock unauthenticated session
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/getRemainingGenerations', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '127.0.0.1',
          'x-fingerprint-hash': 'test-fingerprint'
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isLoggedIn).toBe(false);
      expect(data.userPoints).toBe(0);
      expect(data.userId).toBeNull();
      expect(data.remainingFreeGenerations).toBeDefined();
    });

    it('should not call securePointsService for unauthenticated users', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/getRemainingGenerations', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '127.0.0.1'
        }
      });

      await GET(request);

      expect(mockSecurePointsService.getBalance).not.toHaveBeenCalled();
    });
  });

  describe('Authenticated requests', () => {
    it('should return user data for authenticated users', async () => {
      // Mock authenticated session
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        },
        expires: new Date(Date.now() + 86400000).toISOString()
      };
      mockAuth.mockResolvedValue(mockSession as any);
      mockSecurePointsService.getBalance.mockResolvedValue(100);

      const request = new NextRequest('http://localhost:3000/api/getRemainingGenerations', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '127.0.0.1',
          'x-fingerprint-hash': 'test-fingerprint'
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isLoggedIn).toBe(true);
      expect(data.userPoints).toBe(100);
      expect(data.userId).toBe('user-123');
      expect(mockSecurePointsService.getBalance).toHaveBeenCalledWith('user-123');
    });

    it('should handle points service errors gracefully', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User'
        },
        expires: new Date(Date.now() + 86400000).toISOString()
      };
      mockAuth.mockResolvedValue(mockSession as any);
      mockSecurePointsService.getBalance.mockRejectedValue(new Error('Points service error'));

      const request = new NextRequest('http://localhost:3000/api/getRemainingGenerations', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '127.0.0.1'
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isLoggedIn).toBe(true);
      expect(data.userPoints).toBe(0); // Should default to 0 on error
      expect(data.userId).toBe('user-123');
    });
  });

  describe('Security checks', () => {
    it('should block requests from blocked IPs', async () => {
      mockAuth.mockResolvedValue(null);
      mockUsageTrackingService.isIPBlocked.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/getRemainingGenerations', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '127.0.0.1'
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.blocked).toBe(true);
      expect(data.remainingFreeGenerations).toBe(0);
      expect(data.reason).toContain('restricted');
    });

    it('should block requests from blocked fingerprints', async () => {
      mockAuth.mockResolvedValue(null);
      mockUsageTrackingService.isFingerprintBlocked.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/getRemainingGenerations', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '127.0.0.1',
          'x-fingerprint-hash': 'blocked-fingerprint'
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.blocked).toBe(true);
      expect(data.remainingFreeGenerations).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should return 500 with consistent error format on unexpected errors', async () => {
      mockAuth.mockRejectedValue(new Error('Auth service error'));

      const request = new NextRequest('http://localhost:3000/api/getRemainingGenerations', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '127.0.0.1'
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
      expect(data.remainingFreeGenerations).toBe(0);
      expect(data.isLoggedIn).toBe(false);
      expect(data.userPoints).toBe(0);
      expect(data.userId).toBeNull();
    });

    it('should fail secure on usage tracking errors', async () => {
      mockAuth.mockResolvedValue(null);
      mockUsageTrackingService.checkUsageLimit.mockRejectedValue(new Error('Tracking error'));

      const request = new NextRequest('http://localhost:3000/api/getRemainingGenerations', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '127.0.0.1'
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.remainingFreeGenerations).toBe(0); // Fail secure
    });
  });

  describe('NextAuth integration', () => {
    it('should use NextAuth auth() function for authentication', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/getRemainingGenerations', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '127.0.0.1'
        }
      });

      await GET(request);

      expect(mockAuth).toHaveBeenCalled();
    });

    it('should extract user ID from session.user.id', async () => {
      const mockSession = {
        user: {
          id: 'user-456',
          email: 'another@example.com',
          name: 'Another User'
        },
        expires: new Date(Date.now() + 86400000).toISOString()
      };
      mockAuth.mockResolvedValue(mockSession as any);
      mockSecurePointsService.getBalance.mockResolvedValue(50);

      const request = new NextRequest('http://localhost:3000/api/getRemainingGenerations', {
        method: 'GET',
        headers: {
          'x-forwarded-for': '127.0.0.1'
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.userId).toBe('user-456');
      expect(mockSecurePointsService.getBalance).toHaveBeenCalledWith('user-456');
    });
  });
});
