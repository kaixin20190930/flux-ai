import { Database } from './db';
import { logWithTimestamp } from './logUtils';

export interface UsageRecord {
  id: string;
  fingerprintHash: string | null;
  ipHash: string;
  userId: string | null;
  generationCount: number;
  date: string;
  lastUsedAt: Date;
  suspiciousActivity: boolean;
}

export interface UsageCheckResult {
  allowed: boolean;
  remaining: number;
  reason?: string;
  trackingMethod: 'fingerprint' | 'ip' | 'user' | 'multiple';
  details: {
    fingerprintCount: number;
    ipCount: number;
    userCount: number;
  };
}

export interface UsageStats {
  totalGenerations: number;
  uniqueUsers: number;
  uniqueIPs: number;
  uniqueFingerprints: number;
  suspiciousActivity: number;
}

export class UsageTrackingService {
  private db: Database | null = null;
  private readonly MAX_DAILY_LIMIT = 3;
  private readonly SALT_ROTATION_HOURS = 24;
  private memoryStore: Map<string, any> = new Map();

  constructor(db?: Database) {
    try {
      this.db = db || new Database(process.env as any);
    } catch (error) {
      console.warn('⚠️  Database not available, using memory store for development');
      this.db = null;
    }
  }

  /**
   * Check if user can generate image based on all tracking methods
   */
  async checkUsageLimit(
    fingerprintHash: string | null,
    ipAddress: string,
    userId: string | null
  ): Promise<UsageCheckResult> {
    try {
      // If no database, use memory store
      if (!this.db) {
        return this.checkUsageLimitMemory(fingerprintHash, ipAddress, userId);
      }

      const today = this.getTodayString();
      const ipHash = await this.hashIP(ipAddress);

      // Check all three tracking methods in parallel
      const [fingerprintCount, ipCount, userCount] = await Promise.all([
        fingerprintHash ? this.getUsageCount(fingerprintHash, null, null, today) : 0,
        this.getUsageCount(null, ipHash, null, today),
        userId ? this.getUsageCount(null, null, userId, today) : 0
      ]);

      // Use the maximum count (most restrictive)
      const maxCount = Math.max(fingerprintCount, ipCount, userCount);
      const remaining = Math.max(0, this.MAX_DAILY_LIMIT - maxCount);

      // Determine which tracking method triggered the limit
      let trackingMethod: 'fingerprint' | 'ip' | 'user' | 'multiple' = 'ip';
      if (fingerprintCount === maxCount && ipCount === maxCount) {
        trackingMethod = 'multiple';
      } else if (fingerprintCount === maxCount) {
        trackingMethod = 'fingerprint';
      } else if (userCount === maxCount) {
        trackingMethod = 'user';
      }

      const result: UsageCheckResult = {
        allowed: remaining > 0,
        remaining,
        trackingMethod,
        details: {
          fingerprintCount,
          ipCount,
          userCount
        }
      };

      if (!result.allowed) {
        result.reason = this.getReasonMessage(trackingMethod, maxCount);
      }

      logWithTimestamp('Usage limit check:', result);
      return result;

    } catch (error) {
      logWithTimestamp('Error checking usage limit:', error);
      // Fail secure: deny access on error
      return {
        allowed: false,
        remaining: 0,
        reason: 'Unable to verify usage limits. Please try again later.',
        trackingMethod: 'multiple',
        details: {
          fingerprintCount: 0,
          ipCount: 0,
          userCount: 0
        }
      };
    }
  }

  /**
   * Record a generation in the database
   */
  async recordGeneration(
    fingerprintHash: string | null,
    ipAddress: string,
    userId: string | null,
    userAgent?: string
  ): Promise<void> {
    try {
      // If no database, use memory store
      if (!this.db) {
        this.recordGenerationMemory(fingerprintHash, ipAddress, userId);
        return;
      }

      const today = this.getTodayString();
      const ipHash = await this.hashIP(ipAddress);
      const now = new Date().toISOString();

      // Use transaction to ensure atomicity
      await this.db.transaction(async (tx) => {
        // Record fingerprint usage if available
        if (fingerprintHash) {
          await this.upsertUsageRecord(
            tx,
            fingerprintHash,
            ipHash,
            userId,
            today,
            userAgent
          );
        }

        // Always record IP usage
        await this.upsertUsageRecord(
          tx,
          null,
          ipHash,
          userId,
          today,
          userAgent
        );

        // Record user usage if logged in
        if (userId) {
          await this.upsertUsageRecord(
            tx,
            fingerprintHash,
            ipHash,
            userId,
            today,
            userAgent
          );
        }

        // Update fingerprint tracking
        if (fingerprintHash) {
          await this.updateFingerprintTracking(tx, fingerprintHash, ipHash, userId);
        }
      });

      logWithTimestamp('Generation recorded successfully');

    } catch (error) {
      logWithTimestamp('Error recording generation:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics for a date range
   */
  async getUsageStats(startDate: string, endDate: string): Promise<UsageStats> {
    if (!this.db) {
      return {
        totalGenerations: 0,
        uniqueUsers: 0,
        uniqueIPs: 0,
        uniqueFingerprints: 0,
        suspiciousActivity: 0
      };
    }

    try {
      const result = await this.db.get<any>(`
        SELECT 
          SUM(generation_count) as totalGenerations,
          COUNT(DISTINCT user_id) as uniqueUsers,
          COUNT(DISTINCT ip_hash) as uniqueIPs,
          COUNT(DISTINCT fingerprint_hash) as uniqueFingerprints,
          SUM(CASE WHEN suspicious_activity = 1 THEN generation_count ELSE 0 END) as suspiciousActivity
        FROM usage_tracking
        WHERE date >= ? AND date <= ?
      `, [startDate, endDate]);

      return {
        totalGenerations: result?.totalGenerations || 0,
        uniqueUsers: result?.uniqueUsers || 0,
        uniqueIPs: result?.uniqueIPs || 0,
        uniqueFingerprints: result?.uniqueFingerprints || 0,
        suspiciousActivity: result?.suspiciousActivity || 0
      };

    } catch (error) {
      logWithTimestamp('Error getting usage stats:', error);
      throw error;
    }
  }

  /**
   * Mark usage as suspicious
   */
  async markSuspicious(
    fingerprintHash: string | null,
    ipHash: string,
    userId: string | null,
    date: string
  ): Promise<void> {
    if (!this.db) return;
    
    try {
      await this.db.run(`
        UPDATE usage_tracking
        SET suspicious_activity = 1
        WHERE date = ? AND (
          (fingerprint_hash = ? AND fingerprint_hash IS NOT NULL) OR
          ip_hash = ? OR
          (user_id = ? AND user_id IS NOT NULL)
        )
      `, [date, fingerprintHash, ipHash, userId]);

      logWithTimestamp('Usage marked as suspicious');

    } catch (error) {
      logWithTimestamp('Error marking usage as suspicious:', error);
      throw error;
    }
  }

  /**
   * Clean up old usage records
   */
  async cleanupOldRecords(daysToKeep: number = 30): Promise<number> {
    if (!this.db) return 0;
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffString = this.formatDate(cutoffDate);

      const result = await this.db.run(`
        DELETE FROM usage_tracking
        WHERE date < ?
      `, [cutoffString]);

      const deletedCount = result.changes || 0;
      logWithTimestamp(`Cleaned up ${deletedCount} old usage records`);
      return deletedCount;

    } catch (error) {
      logWithTimestamp('Error cleaning up old records:', error);
      throw error;
    }
  }

  /**
   * Check if IP is blocked
   */
  async isIPBlocked(ipAddress: string): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      const ipHash = await this.hashIP(ipAddress);
      const now = new Date().toISOString();

      const block = await this.db.get<any>(`
        SELECT id FROM ip_blocks
        WHERE ip_hash = ? AND blocked_until > ?
      `, [ipHash, now]);

      return !!block;

    } catch (error) {
      logWithTimestamp('Error checking IP block:', error);
      return false; // Fail open for this check
    }
  }

  /**
   * Check if fingerprint is blocked
   */
  async isFingerprintBlocked(fingerprintHash: string): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      const tracking = await this.db.get<any>(`
        SELECT is_blocked FROM fingerprint_tracking
        WHERE fingerprint_hash = ?
      `, [fingerprintHash]);

      return tracking?.is_blocked === 1;

    } catch (error) {
      logWithTimestamp('Error checking fingerprint block:', error);
      return false; // Fail open for this check
    }
  }

  // Private helper methods

  private async getUsageCount(
    fingerprintHash: string | null,
    ipHash: string | null,
    userId: string | null,
    date: string
  ): Promise<number> {
    if (!this.db) return 0;
    
    try {
      let query = 'SELECT generation_count FROM usage_tracking WHERE date = ?';
      const params: any[] = [date];

      if (fingerprintHash) {
        query += ' AND fingerprint_hash = ?';
        params.push(fingerprintHash);
      } else if (ipHash) {
        query += ' AND ip_hash = ? AND fingerprint_hash IS NULL';
        params.push(ipHash);
      } else if (userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }

      const result = await this.db.get<any>(query, params);
      return result?.generation_count || 0;

    } catch (error) {
      logWithTimestamp('Error getting usage count:', error);
      return 0;
    }
  }

  private async upsertUsageRecord(
    tx: any,
    fingerprintHash: string | null,
    ipHash: string,
    userId: string | null,
    date: string,
    userAgent?: string
  ): Promise<void> {
    const id = crypto.randomUUID();
    
    await tx.run(`
      INSERT INTO usage_tracking (
        id, fingerprint_hash, ip_hash, user_id, generation_count, date, user_agent
      ) VALUES (?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT(fingerprint_hash, ip_hash, user_id, date) 
      DO UPDATE SET 
        generation_count = generation_count + 1,
        last_used_at = CURRENT_TIMESTAMP
    `, [id, fingerprintHash, ipHash, userId, date, userAgent]);
  }

  private async updateFingerprintTracking(
    tx: any,
    fingerprintHash: string,
    ipHash: string,
    userId: string | null
  ): Promise<void> {
    // Check if fingerprint exists
    const existing = await tx.get(`
      SELECT user_ids, ip_hashes FROM fingerprint_tracking
      WHERE fingerprint_hash = ?
    `, [fingerprintHash]);

    if (existing) {
      // Update existing record
      const userIds = existing.user_ids ? JSON.parse(existing.user_ids) : [];
      const ipHashes = existing.ip_hashes ? JSON.parse(existing.ip_hashes) : [];

      if (userId && !userIds.includes(userId)) {
        userIds.push(userId);
      }
      if (!ipHashes.includes(ipHash)) {
        ipHashes.push(ipHash);
      }

      await tx.run(`
        UPDATE fingerprint_tracking
        SET 
          last_seen_at = CURRENT_TIMESTAMP,
          user_ids = ?,
          ip_hashes = ?
        WHERE fingerprint_hash = ?
      `, [JSON.stringify(userIds), JSON.stringify(ipHashes), fingerprintHash]);

    } else {
      // Create new record
      const userIds = userId ? [userId] : [];
      const ipHashes = [ipHash];

      await tx.run(`
        INSERT INTO fingerprint_tracking (
          id, fingerprint_hash, user_ids, ip_hashes
        ) VALUES (?, ?, ?, ?)
      `, [
        crypto.randomUUID(),
        fingerprintHash,
        JSON.stringify(userIds),
        JSON.stringify(ipHashes)
      ]);
    }
  }

  /**
   * Hash IP address with daily rotating salt
   */
  async hashIP(ipAddress: string): Promise<string> {
    const salt = this.getDailySalt();
    const data = ipAddress + salt;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private getDailySalt(): string {
    const date = new Date();
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
    return `${process.env.IP_SALT || 'default_salt'}_${dayOfYear}`;
  }

  private getTodayString(): string {
    return this.formatDate(new Date());
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private getReasonMessage(method: string, count: number): string {
    const messages: Record<string, string> = {
      fingerprint: 'Daily limit reached for your device. Please try again tomorrow or create an account for more generations.',
      ip: 'Daily limit reached for your network. Please try again tomorrow or create an account for more generations.',
      user: 'Daily free limit reached. Please purchase points to continue generating images.',
      multiple: 'Daily limit reached. Please try again tomorrow or create an account for more generations.'
    };

    return messages[method] || messages.multiple;
  }

  // Memory-based fallback methods
  private checkUsageLimitMemory(
    fingerprintHash: string | null,
    ipAddress: string,
    userId: string | null
  ): UsageCheckResult {
    const today = this.getTodayString();
    const key = `${today}:${fingerprintHash || ipAddress || userId}`;
    const count = this.memoryStore.get(key) || 0;
    const remaining = Math.max(0, this.MAX_DAILY_LIMIT - count);

    return {
      allowed: remaining > 0,
      remaining,
      trackingMethod: 'ip',
      details: {
        fingerprintCount: count,
        ipCount: count,
        userCount: 0
      },
      reason: remaining === 0 ? this.getReasonMessage('ip', count) : undefined
    };
  }

  private recordGenerationMemory(
    fingerprintHash: string | null,
    ipAddress: string,
    userId: string | null
  ): void {
    const today = this.getTodayString();
    const key = `${today}:${fingerprintHash || ipAddress || userId}`;
    const count = this.memoryStore.get(key) || 0;
    this.memoryStore.set(key, count + 1);
    logWithTimestamp('Generation recorded in memory:', { key, newCount: count + 1 });
  }
}

// Export singleton instance
export const usageTrackingService = new UsageTrackingService();
