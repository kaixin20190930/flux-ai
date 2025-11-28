import { Database } from './db';
import { Env } from '@/worker/types';
import { AppErrorClass, ErrorCode } from '@/types/database';
import { createJWT, verifyJWT } from './auth';

export interface AuthSession {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;
  userAgent?: string;
  ipAddress?: string;
  isActive: boolean;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  isValid: boolean;
  expiresAt: Date;
  lastUsedAt: Date;
}

export class SessionManager {
  private db: Database;
  private jwtSecret: string;
  private defaultExpiryHours: number = 24 * 7; // 7 days

  constructor(env: Env) {
    this.db = new Database(env);
    this.jwtSecret = env.JWT_SECRET;
    
    if (!this.jwtSecret) {
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'JWT_SECRET is required for session management',
        timestamp: new Date()
      });
    }
  }

  /**
   * Create a new authentication session
   */
  async createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
    expiryHours?: number
  ): Promise<{ token: string; sessionId: string }> {
    try {
      const sessionId = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (expiryHours || this.defaultExpiryHours) * 60 * 60 * 1000);

      // Create JWT token
      const token = await createJWT(
        { 
          userId, 
          sessionId,
          exp: Math.floor(expiresAt.getTime() / 1000)
        },
        this.jwtSecret
      );

      // Hash the token for storage
      const tokenHash = await this.hashToken(token);

      // Store session in database
      await this.db.run(`
        INSERT INTO auth_sessions (
          id, user_id, token_hash, expires_at, created_at, last_used_at,
          user_agent, ip_address, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sessionId,
        userId,
        tokenHash,
        expiresAt.toISOString(),
        now.toISOString(),
        now.toISOString(),
        userAgent || null,
        ipAddress || null,
        1
      ]);

      return { token, sessionId };
    } catch (error) {
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to create session',
        details: { error: (error as Error).message },
        timestamp: new Date()
      });
    }
  }

  /**
   * Validate a JWT token and return session info
   */
  async validateSession(token: string): Promise<SessionInfo | null> {
    try {
      // Verify JWT token
      const payload = await verifyJWT(token, this.jwtSecret);
      if (!payload || !payload.userId || !payload.sessionId) {
        return null;
      }

      // Hash token to find in database
      const tokenHash = await this.hashToken(token);

      // Find session in database
      const session = await this.db.get<any>(`
        SELECT * FROM auth_sessions 
        WHERE id = ? AND token_hash = ? AND is_active = 1
      `, [payload.sessionId, tokenHash]);

      if (!session) {
        return null;
      }

      const now = new Date();
      const expiresAt = new Date(session.expires_at);

      // Check if session is expired
      if (now > expiresAt) {
        await this.deactivateSession(session.id);
        return null;
      }

      // Update last used time
      await this.updateLastUsed(session.id);

      return {
        sessionId: session.id,
        userId: session.user_id,
        isValid: true,
        expiresAt,
        lastUsedAt: new Date(session.last_used_at)
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Refresh a session (extend expiry)
   */
  async refreshSession(
    sessionId: string,
    expiryHours?: number
  ): Promise<{ token: string; expiresAt: Date } | null> {
    try {
      const session = await this.db.get<any>(`
        SELECT * FROM auth_sessions 
        WHERE id = ? AND is_active = 1
      `, [sessionId]);

      if (!session) {
        return null;
      }

      const now = new Date();
      const newExpiresAt = new Date(now.getTime() + (expiryHours || this.defaultExpiryHours) * 60 * 60 * 1000);

      // Create new JWT token
      const newToken = await createJWT(
        { 
          userId: session.user_id, 
          sessionId,
          exp: Math.floor(newExpiresAt.getTime() / 1000)
        },
        this.jwtSecret
      );

      // Hash new token
      const newTokenHash = await this.hashToken(newToken);

      // Update session in database
      await this.db.run(`
        UPDATE auth_sessions 
        SET token_hash = ?, expires_at = ?, last_used_at = ?
        WHERE id = ?
      `, [newTokenHash, newExpiresAt.toISOString(), now.toISOString(), sessionId]);

      return { token: newToken, expiresAt: newExpiresAt };
    } catch (error) {
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to refresh session',
        details: { error: (error as Error).message },
        timestamp: new Date()
      });
    }
  }

  /**
   * Deactivate a specific session
   */
  async deactivateSession(sessionId: string): Promise<void> {
    try {
      await this.db.run(`
        UPDATE auth_sessions 
        SET is_active = 0 
        WHERE id = ?
      `, [sessionId]);
    } catch (error) {
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to deactivate session',
        details: { error: (error as Error).message },
        timestamp: new Date()
      });
    }
  }

  /**
   * Deactivate all sessions for a user
   */
  async deactivateAllUserSessions(userId: string): Promise<void> {
    try {
      await this.db.run(`
        UPDATE auth_sessions 
        SET is_active = 0 
        WHERE user_id = ?
      `, [userId]);
    } catch (error) {
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to deactivate user sessions',
        details: { error: (error as Error).message },
        timestamp: new Date()
      });
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<AuthSession[]> {
    try {
      const sessions = await this.db.all<any>(`
        SELECT * FROM auth_sessions 
        WHERE user_id = ? AND is_active = 1
        ORDER BY last_used_at DESC
      `, [userId]);

      return sessions.map(session => ({
        id: session.id,
        userId: session.user_id,
        tokenHash: session.token_hash,
        expiresAt: new Date(session.expires_at),
        createdAt: new Date(session.created_at),
        lastUsedAt: new Date(session.last_used_at),
        userAgent: session.user_agent,
        ipAddress: session.ip_address,
        isActive: Boolean(session.is_active)
      }));
    } catch (error) {
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to get user sessions',
        details: { error: (error as Error).message },
        timestamp: new Date()
      });
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const now = new Date().toISOString();
      const result = await this.db.run(`
        DELETE FROM auth_sessions 
        WHERE expires_at < ? OR is_active = 0
      `, [now]);

      return result.changes || 0;
    } catch (error) {
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to cleanup expired sessions',
        details: { error: (error as Error).message },
        timestamp: new Date()
      });
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    totalActiveSessions: number;
    expiredSessions: number;
    sessionsToday: number;
  }> {
    try {
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      const [activeResult, expiredResult, todayResult] = await Promise.all([
        this.db.get<{ count: number }>(`
          SELECT COUNT(*) as count FROM auth_sessions 
          WHERE is_active = 1 AND expires_at > ?
        `, [now.toISOString()]),
        
        this.db.get<{ count: number }>(`
          SELECT COUNT(*) as count FROM auth_sessions 
          WHERE expires_at <= ?
        `, [now.toISOString()]),
        
        this.db.get<{ count: number }>(`
          SELECT COUNT(*) as count FROM auth_sessions 
          WHERE created_at >= ?
        `, [today.toISOString()])
      ]);

      return {
        totalActiveSessions: activeResult?.count || 0,
        expiredSessions: expiredResult?.count || 0,
        sessionsToday: todayResult?.count || 0
      };
    } catch (error) {
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to get session statistics',
        details: { error: (error as Error).message },
        timestamp: new Date()
      });
    }
  }

  /**
   * Update last used time for a session
   */
  private async updateLastUsed(sessionId: string): Promise<void> {
    try {
      await this.db.run(`
        UPDATE auth_sessions 
        SET last_used_at = ? 
        WHERE id = ?
      `, [new Date().toISOString(), sessionId]);
    } catch (error) {
      // Don't throw error for this operation as it's not critical
      console.error('Failed to update session last used time:', error);
    }
  }

  /**
   * Hash a token for secure storage
   */
  private async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate session by token (convenience method)
   */
  async validateToken(token: string): Promise<{ userId: string; sessionId: string } | null> {
    const sessionInfo = await this.validateSession(token);
    if (!sessionInfo || !sessionInfo.isValid) {
      return null;
    }

    return {
      userId: sessionInfo.userId,
      sessionId: sessionInfo.sessionId
    };
  }

  /**
   * Create session with user info (convenience method)
   */
  async createUserSession(
    userId: string,
    userInfo: { name: string; email: string },
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ token: string; sessionId: string; user: any }> {
    const { token, sessionId } = await this.createSession(userId, userAgent, ipAddress);
    
    return {
      token,
      sessionId,
      user: {
        userId,
        ...userInfo
      }
    };
  }
}

// Export singleton instance
export const sessionManager = new SessionManager({ 
  JWT_SECRET: process.env.JWT_SECRET || '',
  ENVIRONMENT: 'development'
} as Env);