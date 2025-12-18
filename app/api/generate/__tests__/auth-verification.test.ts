/**
 * @jest-environment node
 * 
 * This test verifies that the generate route uses NextAuth and not JWT
 * by checking the imports and code structure.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Generate Route Authentication Verification', () => {
  const routePath = path.join(__dirname, '../route.ts');
  let routeContent: string;

  beforeAll(() => {
    routeContent = fs.readFileSync(routePath, 'utf-8');
  });

  describe('NextAuth Integration', () => {
    it('should import auth from @/lib/auth (NextAuth)', () => {
      expect(routeContent).toContain("import { auth } from '@/lib/auth'");
    });

    it('should use NextAuth auth() function for authentication', () => {
      expect(routeContent).toContain('const session = await auth()');
    });

    it('should use session.user.id instead of JWT payload', () => {
      expect(routeContent).toContain('session?.user?.id');
    });

    it('should check authentication with session?.user', () => {
      expect(routeContent).toContain('session?.user');
    });
  });

  describe('No JWT Dependencies', () => {
    it('should NOT import from auth-jwt', () => {
      expect(routeContent).not.toContain("from '@/lib/auth-jwt'");
      expect(routeContent).not.toContain('from "@/lib/auth-jwt"');
    });

    it('should NOT use verifyJWT function', () => {
      expect(routeContent).not.toContain('verifyJWT');
    });

    it('should NOT use createJWT function', () => {
      expect(routeContent).not.toContain('createJWT');
    });

    it('should NOT use JWT token verification', () => {
      expect(routeContent).not.toContain('jwt.verify');
      expect(routeContent).not.toContain('JWT.verify');
    });

    it('should NOT import jwt libraries directly', () => {
      expect(routeContent).not.toContain("from 'jsonwebtoken'");
      expect(routeContent).not.toContain('from "jsonwebtoken"');
      expect(routeContent).not.toContain("from '@tsndr/cloudflare-worker-jwt'");
    });
  });

  describe('Error Handling', () => {
    it('should have error responses for insufficient points', () => {
      expect(routeContent).toContain('Insufficient points');
    });

    it('should have error responses for missing prompt', () => {
      expect(routeContent).toContain('Prompt is required');
    });

    it('should have error responses for invalid model', () => {
      expect(routeContent).toContain('Invalid model selected');
    });

    it('should return proper HTTP status codes', () => {
      expect(routeContent).toContain('status: 400');
      expect(routeContent).toContain('status: 403');
      expect(routeContent).toContain('status: 500');
    });
  });

  describe('Prisma Integration', () => {
    it('should import prisma client', () => {
      expect(routeContent).toContain("from '@/lib/prisma'");
    });

    it('should use prisma to fetch user data', () => {
      expect(routeContent).toContain('prisma.user.findUnique');
    });

    it('should use prisma to update user points', () => {
      expect(routeContent).toContain('prisma.user.update');
    });

    it('should use session user ID for database queries', () => {
      // Verify that user ID comes from session, not JWT
      const sessionIdPattern = /session\?\.user\?\.id/;
      expect(routeContent).toMatch(sessionIdPattern);
    });
  });

  describe('Code Quality', () => {
    it('should have proper TypeScript types', () => {
      expect(routeContent).toContain('NextRequest');
      expect(routeContent).toContain('NextResponse');
    });

    it('should export POST handler', () => {
      expect(routeContent).toContain('export async function POST');
    });

    it('should have proper error handling with try-catch', () => {
      expect(routeContent).toContain('try {');
      expect(routeContent).toContain('catch');
    });
  });
});
