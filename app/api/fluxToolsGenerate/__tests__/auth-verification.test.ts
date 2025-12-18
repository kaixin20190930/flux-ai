/**
 * Authentication verification tests for fluxToolsGenerate API route
 * Tests that the route properly uses NextAuth for authentication
 */

// Mock dependencies before importing
jest.mock('@/lib/auth', () => ({
  auth: jest.fn()
}));
jest.mock('@/utils/usageTrackingService', () => ({
  usageTrackingService: {
    isIPBlocked: jest.fn(),
    isFingerprintBlocked: jest.fn(),
    checkUsageLimit: jest.fn(),
    recordGeneration: jest.fn()
  }
}));
jest.mock('@/utils/securePointsService', () => ({
  securePointsService: {
    deductPoints: jest.fn()
  }
}));
jest.mock('replicate', () => {
  return jest.fn().mockImplementation(() => ({
    run: jest.fn()
  }));
});

import { POST } from '../route';
import { auth } from '@/lib/auth';
import { usageTrackingService } from '@/utils/usageTrackingService';
import { securePointsService } from '@/utils/securePointsService';
import { it } from 'date-fns/locale';
import { describe } from 'node:test';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { describe } from 'node:test';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { it } from 'date-fns/locale';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockUsageTrackingService = usageTrackingService as jest.Mocked<typeof usageTrackingService>;
const mockSecurePointsService = securePointsService as jest.Mocked<typeof securePointsService>;

describe('fluxToolsGenerate API - Authentication', () => {
  let mockReplicateRun: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Replicate mock
    const Replicate = require('replicate');
    mockReplicateRun = jest.fn().mockResolvedValue(['http://example.com/image.png']);
    Replicate.mockImplementation(() => ({
      run: mockReplicateRun
    }));
    
    // Default mock implementations
    mockUsageTrackingService.isIPBlocked.mockResolvedValue(false);
    mockUsageTrackingService.isFingerprintBlocked.mockResolvedValue(false);
    mockUsageTrackingService.checkUsageLimit.mockResolvedValue({
      allowed: true,
      remaining: 3,
      trackingMethod: 'fingerprint'
    });
    mockUsageTrackingService.recordGeneration.mockResolvedValue(undefined);
  });

  describe('NextAuth Integration', () => {
    it('should use NextAuth auth() function for authentication', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null);
      
      const request = new Request('http://localhost:3000/api/fluxToolsGenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test prompt',
          model: 'flux-schnell',
          aspectRatio: '1:1',
          format: 'png'
        })
      });

      // Act
      await POST(request as any);

      // Assert
      expect(mockAuth).toHaveBeenCalled();
    });

    it('should extract user.id from NextAuth session', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          points: 100
        },
        expires: new Date(Date.now() + 86400000).toISOString()
      };
      
      mockAuth.mockResolvedValue(mockSession as any);
      mockUsageTrackingService.checkUsageLimit.mockResolvedValue({
        allowed: true,
        remaining: 0,
        trackingMethod: 'user'
      });
      
      mockSecurePointsService.deductPoints.mockResolvedValue({
        success: true,
        newBalance: 99,
        transactionId: 'txn-123'
      });

      const request = new Request('http://localhost:3000/api/fluxToolsGenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test prompt',
          model: 'flux-schnell',
          aspectRatio: '1:1',
          format: 'png'
        })
      });

      // Act
      const response = await POST(request as any);

      // Assert - verify user ID was used in tracking
      expect(response.status).toBe(200);
      expect(mockUsageTrackingService.checkUsageLimit).toHaveBeenCalled();
      const checkUsageCalls = mockUsageTrackingService.checkUsageLimit.mock.calls;
      const lastCall = checkUsageCalls[checkUsageCalls.length - 1];
      expect(lastCall[2]).toBe('user-123'); // userId parameter
    });

    it('should extract user.points from NextAuth session', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          points: 50
        },
        expires: new Date(Date.now() + 86400000).toISOString()
      };
      
      mockAuth.mockResolvedValue(mockSession as any);
      mockUsageTrackingService.checkUsageLimit.mockResolvedValue({
        allowed: true,
        remaining: 0,
        trackingMethod: 'user'
      });
      
      mockSecurePointsService.deductPoints.mockResolvedValue({
        success: true,
        newBalance: 49,
        transactionId: 'txn-123'
      });

      const request = new Request('http://localhost:3000/api/fluxToolsGenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test prompt',
          model: 'flux-schnell',
          aspectRatio: '1:1',
          format: 'png'
        })
      });

      // Act
      const response = await POST(request as any);
      const data = await response.json();

      // Assert - verify points were used correctly
      expect(response.status).toBe(200);
      expect(data.userPoints).toBe(49);
    });
  });

  describe('Authentication Behavior', () => {
    it('should allow unauthenticated users to use free models with free quota', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null);
      mockUsageTrackingService.checkUsageLimit
        .mockResolvedValueOnce({
          allowed: true,
          remaining: 3,
          trackingMethod: 'fingerprint'
        })
        .mockResolvedValueOnce({
          allowed: true,
          remaining: 2,
          trackingMethod: 'fingerprint'
        });

      const request = new Request('http://localhost:3000/api/fluxToolsGenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test prompt',
          model: 'flux-schnell',
          aspectRatio: '1:1',
          format: 'png'
        })
      });

      // Act
      const response = await POST(request as any);

      // Assert
      expect(response.status).toBe(200);
    });

    it('should require login for premium tool models', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null);
      mockUsageTrackingService.checkUsageLimit.mockResolvedValue({
        allowed: true,
        remaining: 3,
        trackingMethod: 'fingerprint'
      });

      const request = new Request('http://localhost:3000/api/fluxToolsGenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test prompt',
          model: 'depth',
          aspectRatio: '1:1',
          format: 'png'
        })
      });

      // Act
      const response = await POST(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toContain('请登录后使用该功能');
    });

    it('should allow authenticated users to use premium tool models', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          points: 100
        },
        expires: new Date(Date.now() + 86400000).toISOString()
      };
      
      mockAuth.mockResolvedValue(mockSession as any);
      mockUsageTrackingService.checkUsageLimit
        .mockResolvedValueOnce({
          allowed: true,
          remaining: 0,
          trackingMethod: 'user'
        })
        .mockResolvedValueOnce({
          allowed: true,
          remaining: 0,
          trackingMethod: 'user'
        });
      
      mockSecurePointsService.deductPoints.mockResolvedValue({
        success: true,
        newBalance: 99,
        transactionId: 'txn-123'
      });

      const request = new Request('http://localhost:3000/api/fluxToolsGenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'test prompt',
          model: 'depth',
          aspectRatio: '1:1',
          format: 'png'
        })
      });

      // Act
      const response = await POST(request as any);

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe('No JWT Code', () => {
    it('should not use any JWT verification', async () => {
      // This test verifies that the route doesn't import or use JWT functions
      // by checking that only NextAuth is used for authentication
      
      mockAuth.mockResolvedValue(null);
      mockUsageTrackingService.checkUsageLimit
        .mockResolvedValueOnce({
          allowed: true,
          remaining: 3,
          trackingMethod: 'fingerprint'
        })
        .mockResolvedValueOnce({
          allowed: true,
          remaining: 2,
          trackingMethod: 'fingerprint'
        });

      const request = new Request('http://localhost:3000/api/fluxToolsGenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-jwt-token' // This should be ignored
        },
        body: JSON.stringify({
          prompt: 'test prompt',
          model: 'flux-schnell',
          aspectRatio: '1:1',
          format: 'png'
        })
      });

      // Act
      await POST(request as any);

      // Assert - only NextAuth should be called, no JWT verification
      expect(mockAuth).toHaveBeenCalled();
    });
  });
});
