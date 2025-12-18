import { Env } from '@/worker/types';
import { AppErrorClass, ErrorCode } from '@/types/database';

export interface DbResult {
  lastID?: number;
  changes?: number;
}

export class Database {
  private db: any;

  constructor(private env: any) {
    this.db = env.DB || env['DB-DEV'];
    if (!this.db) {
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'No D1 database binding found',
        timestamp: new Date()
      });
    }
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    try {
      const result = await this.db.prepare(sql).bind(...params).first();
      return result as T;
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
      const result = await this.db.prepare(sql).bind(...params).all();
      return result.results as T[];
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
      const result = await this.db.prepare(sql).bind(...params).run();
      return {
        lastID: result.meta.last_row_id,
        changes: result.meta.changes
      };
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
      await this.db.prepare(sql).run();
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

  // 新增：事务支持
  async transaction<T>(callback: (db: Database) => Promise<T>): Promise<T> {
    // D1 目前不支持显式事务，但我们可以为将来的支持做准备
    return await callback(this);
  }

  // 新增：批量插入
  async batchInsert(table: string, records: any[]): Promise<DbResult[]> {
    const results: DbResult[] = [];
    
    for (const record of records) {
      const columns = Object.keys(record);
      const values = Object.values(record);
      const placeholders = columns.map(() => '?').join(', ');
      
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      const result = await this.run(sql, values);
      results.push(result);
    }
    
    return results;
  }

  // 新增：分页查询
  async paginate<T>(
    sql: string, 
    params: any[] = [], 
    page: number = 1, 
    limit: number = 20
  ): Promise<{ items: T[], total: number, page: number, limit: number }> {
    // 获取总数
    const countSql = sql.replace(/SELECT.*?FROM/i, 'SELECT COUNT(*) as count FROM');
    const countResult = await this.get<{ count: number }>(countSql, params);
    const total = countResult?.count || 0;

    // 获取分页数据
    const offset = (page - 1) * limit;
    const paginatedSql = `${sql} LIMIT ${limit} OFFSET ${offset}`;
    const items = await this.all<T>(paginatedSql, params);

    return {
      items,
      total,
      page,
      limit
    };
  }
}

// 初始化数据库表
export async function initDb(env: Env) {
  const db = new Database(env);
  
  // 创建generations表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS generations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      model_type TEXT,
      prompt TEXT,
      image_url TEXT,
      points_consumed INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 创建flux_tools_usage表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS flux_tools_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      tool_type TEXT,
      input_image_url TEXT,
      output_image_url TEXT,
      points_consumed INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}