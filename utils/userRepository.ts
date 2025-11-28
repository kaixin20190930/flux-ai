import { Database } from './db';
import { Env } from '@/worker/types';
import { AppErrorClass, ErrorCode } from '@/types/database';
import { EdgeAuth } from './edgeUtils';
import { MemoryStore } from './memoryStore';

// User interface based on current schema and requirements
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional for Google users
  isGoogleUser: boolean;
  googleId?: string;
  points: number;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
  password?: string;
  isGoogleUser?: boolean;
  googleId?: string;
  points?: number;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface GoogleUserData {
  email: string;
  name: string;
  googleId: string;
}

// Configuration for retry mechanism
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export class UserRepository {
  private db: Database | null = null;
  private env: Env | null = null;
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 100,
    maxDelay: 2000
  };

  // Hardcoded users for local development fallback
  private fallbackUsers: User[] = [
    {
      id: '1',
      email: 'test@example.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      name: 'Test User',
      points: 100,
      isGoogleUser: false,
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      email: 'admin@example.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      name: 'Admin User',
      points: 1000,
      isGoogleUser: false,
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  constructor(env?: Env) {
    if (env) {
      this.env = env;
      try {
        this.db = new Database(env);
      } catch (error) {
        console.warn('Failed to initialize database, falling back to hardcoded users:', error);
        this.db = null;
      }
    }
  }

  /**
   * Initialize the repository with environment
   */
  public initialize(env: Env): void {
    this.env = env;
    try {
      this.db = new Database(env);
    } catch (error) {
      console.warn('Failed to initialize database, falling back to hardcoded users:', error);
      this.db = null;
    }
  }

  /**
   * Check if database is available
   */
  private isDatabaseAvailable(): boolean {
    return this.db !== null && this.env !== null;
  }

  /**
   * Execute database operation with retry mechanism
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain types of errors
        if (error instanceof AppErrorClass && 
            (error.code === ErrorCode.VALIDATION_ERROR || 
             error.code === ErrorCode.UNAUTHORIZED)) {
          throw error;
        }

        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, attempt),
            this.retryConfig.maxDelay
          );
          
          console.warn(`${operationName} failed (attempt ${attempt + 1}), retrying in ${delay}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // If all retries failed, throw the last error
    throw new AppErrorClass({
      code: ErrorCode.DATABASE_ERROR,
      message: `${operationName} failed after ${this.retryConfig.maxRetries} retries`,
      details: { originalError: lastError?.message },
      timestamp: new Date()
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Email is required',
        timestamp: new Date()
      });
    }

    // Try database first
    if (this.isDatabaseAvailable()) {
      return this.executeWithRetry(async () => {
        const result = await this.db!.get<any>(
          'SELECT * FROM users WHERE email = ? AND status != ?',
          [email, 'deleted']
        );

        if (!result) return null;
        return this.mapDbUserToUser(result);
      }, 'findByEmail');
    }

    // Use global memory store for development
    const user = MemoryStore.getUserByEmail(email);
    if (user && user.status !== 'deleted') {
      return user;
    }

    // Fallback to hardcoded users (legacy)
    const fallbackUser = this.fallbackUsers.find(u => u.email === email && u.status !== 'deleted');
    return fallbackUser || null;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    if (!id) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'User ID is required',
        timestamp: new Date()
      });
    }

    // Try database first
    if (this.isDatabaseAvailable()) {
      return this.executeWithRetry(async () => {
        const result = await this.db!.get<any>(
          'SELECT * FROM users WHERE id = ? AND status != ?',
          [id, 'deleted']
        );

        if (!result) return null;
        return this.mapDbUserToUser(result);
      }, 'findById');
    }

    // Use global memory store for development
    const user = MemoryStore.getUserById(id);
    if (user && user.status !== 'deleted') {
      return user;
    }

    // Fallback to hardcoded users (legacy)
    const fallbackUser = this.fallbackUsers.find(u => u.id === id && u.status !== 'deleted');
    return fallbackUser || null;
  }

  /**
   * Find user by Google ID
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    if (!googleId) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Google ID is required',
        timestamp: new Date()
      });
    }

    // Try database first
    if (this.isDatabaseAvailable()) {
      return this.executeWithRetry(async () => {
        const result = await this.db!.get<any>(
          'SELECT * FROM users WHERE google_id = ? AND status != ?',
          [googleId, 'deleted']
        );

        if (!result) return null;
        return this.mapDbUserToUser(result);
      }, 'findByGoogleId');
    }

    // Fallback to hardcoded users (check if any have this googleId)
    const user = this.fallbackUsers.find(u => u.googleId === googleId && u.status !== 'deleted');
    return user || null;
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<User> {
    // Validate required fields
    if (!userData.email || !userData.name) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Email and name are required',
        timestamp: new Date()
      });
    }

    // Check if user already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'User with this email already exists',
        timestamp: new Date()
      });
    }

    const now = new Date();
    const userId = crypto.randomUUID();

    // Try database first
    if (this.isDatabaseAvailable()) {
      return this.executeWithRetry(async () => {
        // Hash password if provided
        let hashedPassword: string | null = null;
        if (userData.password) {
          hashedPassword = await EdgeAuth.hashPassword(userData.password);
        }

        await this.db!.run(`
          INSERT INTO users (
            id, name, email, password_hash, is_google_user, google_id, 
            points, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId,
          userData.name,
          userData.email,
          hashedPassword,
          userData.isGoogleUser ? 1 : 0,
          userData.googleId || null,
          userData.points || 50,
          'active',
          now.toISOString(),
          now.toISOString()
        ]);

        // Return the created user
        const createdUser = await this.findById(userId);
        if (!createdUser) {
          throw new Error('Failed to retrieve created user');
        }
        return createdUser;
      }, 'createUser');
    }

    // Fallback to memory store (for development)
    let hashedPassword: string | undefined;
    if (userData.password) {
      hashedPassword = await EdgeAuth.hashPassword(userData.password);
    }

    const newUser: User = {
      id: userId,
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      isGoogleUser: userData.isGoogleUser || false,
      googleId: userData.googleId,
      points: userData.points || 50,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    // Save to global memory store
    MemoryStore.saveUser(newUser);
    
    // Also add to fallback array for backward compatibility
    this.fallbackUsers.push(newUser);
    
    return newUser;
  }

  /**
   * Update user information
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    if (!userId) {
      throw new AppErrorClass({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'User ID is required',
        timestamp: new Date()
      });
    }

    const now = new Date();

    // Try database first
    if (this.isDatabaseAvailable()) {
      return this.executeWithRetry(async () => {
        const updateFields: string[] = [];
        const params: any[] = [];

        // Build update query dynamically
        if (updates.name !== undefined) {
          updateFields.push('name = ?');
          params.push(updates.name);
        }
        if (updates.email !== undefined) {
          updateFields.push('email = ?');
          params.push(updates.email);
        }
        if (updates.points !== undefined) {
          updateFields.push('points = ?');
          params.push(updates.points);
        }
        if (updates.status !== undefined) {
          updateFields.push('status = ?');
          params.push(updates.status);
        }
        if (updates.lastLoginAt !== undefined) {
          updateFields.push('last_login_at = ?');
          params.push(updates.lastLoginAt.toISOString());
        }

        // Always update the updated_at field
        updateFields.push('updated_at = ?');
        params.push(now.toISOString());
        params.push(userId);

        if (updateFields.length <= 1) {
          // No fields to update except updated_at
          const user = await this.findById(userId);
          if (!user) {
            throw new AppErrorClass({
              code: ErrorCode.HISTORY_NOT_FOUND,
              message: 'User not found',
              timestamp: new Date()
            });
          }
          return user;
        }

        const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        const result = await this.db!.run(sql, params);

        if (result.changes === 0) {
          throw new AppErrorClass({
            code: ErrorCode.HISTORY_NOT_FOUND,
            message: 'User not found',
            timestamp: new Date()
          });
        }

        // Return updated user
        const updatedUser = await this.findById(userId);
        if (!updatedUser) {
          throw new Error('Failed to retrieve updated user');
        }
        return updatedUser;
      }, 'updateUser');
    }

    // Use global memory store for development
    const memoryUser = MemoryStore.updateUser(userId, updates);
    if (memoryUser) {
      return memoryUser;
    }

    // Fallback to hardcoded users
    const userIndex = this.fallbackUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      throw new AppErrorClass({
        code: ErrorCode.HISTORY_NOT_FOUND,
        message: 'User not found',
        timestamp: new Date()
      });
    }

    // Update the user
    this.fallbackUsers[userIndex] = {
      ...this.fallbackUsers[userIndex],
      ...updates,
      updatedAt: now
    };

    return this.fallbackUsers[userIndex];
  }

  /**
   * Validate user credentials
   */
  async validateCredentials(email: string, password: string): Promise<boolean> {
    if (!email || !password) {
      console.log('[validateCredentials] Missing email or password');
      return false;
    }

    const user = await this.findByEmail(email);
    if (!user) {
      console.log('[validateCredentials] User not found:', email);
      return false;
    }
    
    if (!user.password) {
      console.log('[validateCredentials] User has no password (Google user?):', email);
      return false;
    }

    console.log('[validateCredentials] Found user:', {
      email: user.email,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });

    try {
      const isValid = await EdgeAuth.verifyPassword(password, user.password);
      console.log('[validateCredentials] Password verification result:', isValid);
      return isValid;
    } catch (error) {
      console.error('[validateCredentials] Password verification error:', error);
      return false;
    }
  }

  /**
   * Update user's last login time
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.updateUser(userId, { lastLoginAt: new Date() });
  }

  /**
   * Update user points
   */
  async updatePoints(userId: string, points: number): Promise<User> {
    return this.updateUser(userId, { points });
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(userId: string): Promise<User> {
    return this.updateUser(userId, { status: 'suspended' });
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    googleUsers: number;
    newUsersToday: number;
  }> {
    if (this.isDatabaseAvailable()) {
      return this.executeWithRetry(async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalResult, activeResult, googleResult, newResult] = await Promise.all([
          this.db!.get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE status != ?', ['deleted']),
          this.db!.get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE status = ?', ['active']),
          this.db!.get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE is_google_user = 1 AND status != ?', ['deleted']),
          this.db!.get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE created_at >= ? AND status != ?', [today.toISOString(), 'deleted'])
        ]);

        return {
          totalUsers: totalResult?.count || 0,
          activeUsers: activeResult?.count || 0,
          googleUsers: googleResult?.count || 0,
          newUsersToday: newResult?.count || 0
        };
      }, 'getUserStats');
    }

    // Fallback statistics
    const activeUsers = this.fallbackUsers.filter(u => u.status === 'active');
    const googleUsers = this.fallbackUsers.filter(u => u.isGoogleUser && u.status !== 'deleted');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = this.fallbackUsers.filter(u => 
      u.createdAt >= today && u.status !== 'deleted'
    );

    return {
      totalUsers: this.fallbackUsers.filter(u => u.status !== 'deleted').length,
      activeUsers: activeUsers.length,
      googleUsers: googleUsers.length,
      newUsersToday: newUsersToday.length
    };
  }

  /**
   * Map database result to User interface
   */
  private mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      password: dbUser.password_hash,
      isGoogleUser: Boolean(dbUser.is_google_user),
      googleId: dbUser.google_id,
      points: dbUser.points || 0,
      status: dbUser.status || 'active',
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
      lastLoginAt: dbUser.last_login_at ? new Date(dbUser.last_login_at) : undefined
    };
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isDatabaseAvailable()) {
      return false;
    }

    try {
      await this.db!.get('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Get connection status and environment info
   */
  getConnectionInfo(): {
    hasDatabase: boolean;
    hasEnv: boolean;
    environment: string;
    fallbackMode: boolean;
  } {
    return {
      hasDatabase: this.db !== null,
      hasEnv: this.env !== null,
      environment: this.env?.ENVIRONMENT || 'unknown',
      fallbackMode: !this.isDatabaseAvailable()
    };
  }
}

// Export singleton instance
export const userRepository = new UserRepository();