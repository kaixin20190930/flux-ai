import { Database } from './db';
import { logWithTimestamp } from './logUtils';
import { AppErrorClass, ErrorCode } from '@/types/database';

export interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  generationId?: string;
  referenceId?: string;
  metadata?: any;
  createdAt: Date;
}

export interface PointsOperationResult {
  success: boolean;
  newBalance: number;
  transactionId?: string;
  error?: string;
}

export interface PointsHistory {
  transactions: PointsTransaction[];
  totalEarned: number;
  totalSpent: number;
  currentBalance: number;
}

export class SecurePointsService {
  private db: Database | null = null;
  private memoryStore: Map<string, number> = new Map();

  constructor(db?: Database) {
    try {
      this.db = db || new Database(process.env as any);
    } catch (error) {
      console.warn('⚠️  Database not available, using memory store for development');
      this.db = null;
    }
  }

  /**
   * Deduct points from user account with transaction safety
   */
  async deductPoints(
    userId: string,
    amount: number,
    reason: string,
    generationId?: string,
    referenceId?: string,
    metadata?: any
  ): Promise<PointsOperationResult> {
    if (amount <= 0) {
      return {
        success: false,
        newBalance: 0,
        error: 'Amount must be positive'
      };
    }

    if (!this.db) {
      return {
        success: false,
        newBalance: 0,
        error: 'Database not available'
      };
    }

    try {
      return await this.db.transaction(async (tx) => {
        // 1. Lock user record and get current balance
        const user = await tx.get<any>(`
          SELECT id, points FROM users WHERE id = ?
        `, [userId]);

        if (!user) {
          throw new AppErrorClass({
            code: ErrorCode.NOT_FOUND,
            message: 'User not found',
            timestamp: new Date()
          });
        }

        const balanceBefore = user.points;

        // 2. Check if user has enough points
        if (balanceBefore < amount) {
          logWithTimestamp('Insufficient points:', { userId, required: amount, available: balanceBefore });
          return {
            success: false,
            newBalance: balanceBefore,
            error: `Insufficient points. Required: ${amount}, Available: ${balanceBefore}`
          };
        }

        const balanceAfter = balanceBefore - amount;

        // 3. Update user points
        await tx.run(`
          UPDATE users SET points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `, [balanceAfter, userId]);

        // 4. Record transaction
        const transactionId = crypto.randomUUID();
        await tx.run(`
          INSERT INTO points_transactions (
            id, user_id, amount, balance_before, balance_after, 
            reason, generation_id, reference_id, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          transactionId,
          userId,
          -amount, // Negative for deduction
          balanceBefore,
          balanceAfter,
          reason,
          generationId || null,
          referenceId || null,
          metadata ? JSON.stringify(metadata) : null
        ]);

        logWithTimestamp('Points deducted successfully:', {
          userId,
          amount,
          newBalance: balanceAfter,
          transactionId
        });

        return {
          success: true,
          newBalance: balanceAfter,
          transactionId
        };
      });

    } catch (error) {
      logWithTimestamp('Error deducting points:', error);
      
      if (error instanceof AppErrorClass) {
        return {
          success: false,
          newBalance: 0,
          error: error.message
        };
      }

      return {
        success: false,
        newBalance: 0,
        error: 'Failed to deduct points. Please try again.'
      };
    }
  }

  /**
   * Add points to user account
   */
  async addPoints(
    userId: string,
    amount: number,
    reason: string,
    referenceId?: string,
    metadata?: any
  ): Promise<PointsOperationResult> {
    if (amount <= 0) {
      return {
        success: false,
        newBalance: 0,
        error: 'Amount must be positive'
      };
    }

    if (!this.db) {
      return {
        success: false,
        newBalance: 0,
        error: 'Database not available'
      };
    }

    try {
      return await this.db.transaction(async (tx) => {
        // 1. Lock user record and get current balance
        const user = await tx.get<any>(`
          SELECT id, points FROM users WHERE id = ?
        `, [userId]);

        if (!user) {
          throw new AppErrorClass({
            code: ErrorCode.NOT_FOUND,
            message: 'User not found',
            timestamp: new Date()
          });
        }

        const balanceBefore = user.points;
        const balanceAfter = balanceBefore + amount;

        // 2. Update user points
        await tx.run(`
          UPDATE users SET points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `, [balanceAfter, userId]);

        // 3. Record transaction
        const transactionId = crypto.randomUUID();
        await tx.run(`
          INSERT INTO points_transactions (
            id, user_id, amount, balance_before, balance_after, 
            reason, reference_id, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          transactionId,
          userId,
          amount, // Positive for addition
          balanceBefore,
          balanceAfter,
          reason,
          referenceId || null,
          metadata ? JSON.stringify(metadata) : null
        ]);

        logWithTimestamp('Points added successfully:', {
          userId,
          amount,
          newBalance: balanceAfter,
          transactionId
        });

        return {
          success: true,
          newBalance: balanceAfter,
          transactionId
        };
      });

    } catch (error) {
      logWithTimestamp('Error adding points:', error);
      
      if (error instanceof AppErrorClass) {
        return {
          success: false,
          newBalance: 0,
          error: error.message
        };
      }

      return {
        success: false,
        newBalance: 0,
        error: 'Failed to add points. Please try again.'
      };
    }
  }

  /**
   * Refund points (e.g., when generation fails)
   */
  async refundPoints(
    userId: string,
    amount: number,
    originalTransactionId: string,
    reason: string = 'Generation failed - refund'
  ): Promise<PointsOperationResult> {
    return await this.addPoints(
      userId,
      amount,
      reason,
      originalTransactionId,
      { type: 'refund', originalTransaction: originalTransactionId }
    );
  }

  /**
   * Get user's current points balance
   */
  async getBalance(userId: string): Promise<number> {
    try {
      // If no database, use memory store
      if (!this.db) {
        return this.memoryStore.get(userId) || 0;
      }

      const user = await this.db.get<any>(`
        SELECT points FROM users WHERE id = ?
      `, [userId]);

      return user?.points || 0;

    } catch (error) {
      logWithTimestamp('Error getting balance:', error);
      // Return 0 instead of throwing in development
      return 0;
    }
  }

  /**
   * Get user's points transaction history
   */
  async getHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PointsHistory> {
    if (!this.db) {
      return {
        transactions: [],
        totalEarned: 0,
        totalSpent: 0,
        currentBalance: this.memoryStore.get(userId) || 0
      };
    }

    try {
      // Get transactions
      const transactions = await this.db.all<any>(`
        SELECT 
          id, user_id, amount, balance_before, balance_after,
          reason, generation_id, reference_id, metadata, created_at
        FROM points_transactions
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);

      // Get summary
      const summary = await this.db.get<any>(`
        SELECT 
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as totalEarned,
          SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as totalSpent
        FROM points_transactions
        WHERE user_id = ?
      `, [userId]);

      // Get current balance
      const currentBalance = await this.getBalance(userId);

      return {
        transactions: transactions.map(t => ({
          id: t.id,
          userId: t.user_id,
          amount: t.amount,
          balanceBefore: t.balance_before,
          balanceAfter: t.balance_after,
          reason: t.reason,
          generationId: t.generation_id,
          referenceId: t.reference_id,
          metadata: t.metadata ? JSON.parse(t.metadata) : null,
          createdAt: new Date(t.created_at)
        })),
        totalEarned: summary?.totalEarned || 0,
        totalSpent: summary?.totalSpent || 0,
        currentBalance
      };

    } catch (error) {
      logWithTimestamp('Error getting points history:', error);
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to get points history',
        details: { error: (error as Error).message },
        timestamp: new Date()
      });
    }
  }

  /**
   * Verify points transaction integrity
   */
  async verifyTransaction(transactionId: string): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    try {
      const transaction = await this.db.get<any>(`
        SELECT balance_before, balance_after, amount
        FROM points_transactions
        WHERE id = ?
      `, [transactionId]);

      if (!transaction) {
        return false;
      }

      // Verify the math
      const expectedBalance = transaction.balance_before + transaction.amount;
      return expectedBalance === transaction.balance_after;

    } catch (error) {
      logWithTimestamp('Error verifying transaction:', error);
      return false;
    }
  }

  /**
   * Detect potential points manipulation
   */
  async detectManipulation(userId: string): Promise<{
    suspicious: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    if (!this.db) {
      return { suspicious: false, reasons: [] };
    }

    try {
      // Check for impossible balance changes
      const transactions = await this.db.all<any>(`
        SELECT balance_before, balance_after, amount
        FROM points_transactions
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 100
      `, [userId]);

      for (const tx of transactions) {
        const expectedBalance = tx.balance_before + tx.amount;
        if (expectedBalance !== tx.balance_after) {
          reasons.push(`Invalid transaction: ${tx.id}`);
        }
      }

      // Check for rapid point additions
      const recentAdditions = await this.db.get<any>(`
        SELECT COUNT(*) as count, SUM(amount) as total
        FROM points_transactions
        WHERE user_id = ? 
          AND amount > 0 
          AND created_at > datetime('now', '-1 hour')
      `, [userId]);

      if (recentAdditions && recentAdditions.count > 10) {
        reasons.push(`Suspicious: ${recentAdditions.count} point additions in last hour`);
      }

      if (recentAdditions && recentAdditions.total > 1000) {
        reasons.push(`Suspicious: ${recentAdditions.total} points added in last hour`);
      }

      // Check for negative balance attempts
      const negativeAttempts = await this.db.get<any>(`
        SELECT COUNT(*) as count
        FROM points_transactions
        WHERE user_id = ? AND balance_after < 0
      `, [userId]);

      if (negativeAttempts && negativeAttempts.count > 0) {
        reasons.push(`Suspicious: ${negativeAttempts.count} negative balance attempts`);
      }

      return {
        suspicious: reasons.length > 0,
        reasons
      };

    } catch (error) {
      logWithTimestamp('Error detecting manipulation:', error);
      return {
        suspicious: false,
        reasons: ['Error checking for manipulation']
      };
    }
  }

  /**
   * Get points statistics for admin dashboard
   */
  async getStatistics(startDate: string, endDate: string): Promise<{
    totalTransactions: number;
    totalPointsIssued: number;
    totalPointsSpent: number;
    averageBalance: number;
    topSpenders: Array<{ userId: string; totalSpent: number }>;
  }> {
    if (!this.db) {
      return {
        totalTransactions: 0,
        totalPointsIssued: 0,
        totalPointsSpent: 0,
        averageBalance: 0,
        topSpenders: []
      };
    }

    try {
      const stats = await this.db.get<any>(`
        SELECT 
          COUNT(*) as totalTransactions,
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as totalPointsIssued,
          SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as totalPointsSpent
        FROM points_transactions
        WHERE created_at >= ? AND created_at <= ?
      `, [startDate, endDate]);

      const avgBalance = await this.db.get<any>(`
        SELECT AVG(points) as averageBalance
        FROM users
        WHERE status = 'active'
      `);

      const topSpenders = await this.db.all<any>(`
        SELECT 
          user_id as userId,
          SUM(ABS(amount)) as totalSpent
        FROM points_transactions
        WHERE amount < 0 
          AND created_at >= ? 
          AND created_at <= ?
        GROUP BY user_id
        ORDER BY totalSpent DESC
        LIMIT 10
      `, [startDate, endDate]);

      return {
        totalTransactions: stats?.totalTransactions || 0,
        totalPointsIssued: stats?.totalPointsIssued || 0,
        totalPointsSpent: stats?.totalPointsSpent || 0,
        averageBalance: avgBalance?.averageBalance || 0,
        topSpenders: topSpenders || []
      };

    } catch (error) {
      logWithTimestamp('Error getting points statistics:', error);
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to get points statistics',
        details: { error: (error as Error).message },
        timestamp: new Date()
      });
    }
  }
}

// Export singleton instance
export const securePointsService = new SecurePointsService();
