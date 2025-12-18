/**
 * Local SQLite Database Adapter
 * 用于本地开发环境的 SQLite 数据库适配器
 */

import { AppErrorClass, ErrorCode } from '@/types/database';

export interface DbResult {
  lastID?: number;
  changes?: number;
}

// 动态导入 better-sqlite3（仅在 Node.js 环境中可用）
let BetterSqlite3: any = null;

try {
  // 尝试导入 better-sqlite3
  if (typeof window === 'undefined') {
    BetterSqlite3 = require('better-sqlite3');
  }
} catch (error) {
  console.warn('better-sqlite3 not available, using D1 only');
}

export class LocalDatabase {
  private db: any;
  private isLocal: boolean = false;

  constructor(dbPath: string = './flux-ai.db') {
    if (BetterSqlite3) {
      // 本地 SQLite
      this.db = new BetterSqlite3(dbPath);
      this.isLocal = true;
      console.log(`📁 Using local SQLite database: ${dbPath}`);
    } else {
      throw new Error('better-sqlite3 is not available. Please install it: npm install better-sqlite3');
    }
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    try {
      if (this.isLocal) {
        const stmt = this.db.prepare(sql);
        const result = stmt.get(...params);
        return result as T;
      }
    } catch (error) {
      console.error('数据库查询失败:', error);
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database query failed',
        details: { sql, params, error },
        timestamp: new Date()
      });
    }
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      if (this.isLocal) {
        const stmt = this.db.prepare(sql);
        const results = stmt.all(...params);
        return results as T[];
      }
      return [];
    } catch (error) {
      console.error('数据库查询失败:', error);
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database query failed',
        details: { sql, params, error },
        timestamp: new Date()
      });
    }
  }

  async run(sql: string, params: any[] = []): Promise<DbResult> {
    try {
      if (this.isLocal) {
        const stmt = this.db.prepare(sql);
        const result = stmt.run(...params);
        return {
          lastID: result.lastInsertRowid,
          changes: result.changes
        };
      }
      return { changes: 0 };
    } catch (error) {
      console.error('数据库操作失败:', error);
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database operation failed',
        details: { sql, params, error },
        timestamp: new Date()
      });
    }
  }

  async exec(sql: string): Promise<void> {
    try {
      if (this.isLocal) {
        this.db.exec(sql);
      }
    } catch (error) {
      console.error('SQL执行失败:', error);
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'SQL execution failed',
        details: { sql, error },
        timestamp: new Date()
      });
    }
  }

  // 事务支持
  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    if (this.isLocal) {
      const transaction = this.db.transaction((cb: any) => {
        return cb(this);
      });
      return transaction(callback);
    }
    // 如果不是本地数据库，直接执行
    return await callback(this);
  }

  close() {
    if (this.isLocal && this.db) {
      this.db.close();
    }
  }
}

// 创建单例实例
let dbInstance: LocalDatabase | null = null;

export function getLocalDatabase(dbPath: string = './flux-ai.db'): LocalDatabase {
  if (!dbInstance) {
    dbInstance = new LocalDatabase(dbPath);
  }
  return dbInstance;
}
