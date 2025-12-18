import { Database } from './db';
import { Env } from '@/worker/types';

export class DatabaseMigrations {
  private db: Database;

  constructor(env: Env) {
    this.db = new Database(env);
  }

  async runMigrations(): Promise<void> {
    console.log('开始运行数据库迁移...');
    
    try {
      // 创建迁移记录表
      await this.createMigrationsTable();
      
      // 运行各个迁移
      await this.runMigration('001_create_generation_history', this.createGenerationHistoryTable.bind(this));
      await this.runMigration('002_create_batch_jobs', this.createBatchJobsTable.bind(this));
      await this.runMigration('003_create_edit_history', this.createEditHistoryTable.bind(this));
      await this.runMigration('004_create_share_records', this.createShareRecordsTable.bind(this));
      await this.runMigration('005_create_system_metrics', this.createSystemMetricsTable.bind(this));
      await this.runMigration('006_add_indexes', this.addIndexes.bind(this));
      await this.runMigration('007_create_image_search_history', this.createImageSearchHistoryTable.bind(this));
      await this.runMigration('008_update_edit_history', this.updateEditHistoryTable.bind(this));
      await this.runMigration('009_create_user_analytics', this.createUserAnalyticsTables.bind(this));
      await this.runMigration('010_update_image_search_history', this.updateImageSearchHistoryTable.bind(this));
      
      console.log('数据库迁移完成');
    } catch (error) {
      console.error('数据库迁移失败:', error);
      throw error;
    }
  }

  private async createMigrationsTable(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private async runMigration(name: string, migrationFn: () => Promise<void>): Promise<void> {
    // 检查迁移是否已执行
    const existing = await this.db.get<{ name: string }>(
      'SELECT name FROM migrations WHERE name = ?',
      [name]
    );

    if (existing) {
      console.log(`迁移 ${name} 已执行，跳过`);
      return;
    }

    console.log(`执行迁移: ${name}`);
    await migrationFn();
    
    // 记录迁移执行
    await this.db.run(
      'INSERT INTO migrations (name) VALUES (?)',
      [name]
    );
    console.log(`迁移 ${name} 执行完成`);
  }

  private async createGenerationHistoryTable(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS generation_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        model TEXT NOT NULL,
        parameters TEXT NOT NULL,
        image_url TEXT NOT NULL,
        thumbnail_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        tags TEXT DEFAULT '[]',
        is_public BOOLEAN DEFAULT FALSE,
        download_count INTEGER DEFAULT 0
      )
    `);
  }

  private async createBatchJobsTable(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS batch_jobs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        prompts TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        results TEXT DEFAULT '[]'
      )
    `);
  }

  private async createEditHistoryTable(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS edit_history (
        id TEXT PRIMARY KEY,
        generation_id TEXT NOT NULL,
        operations TEXT NOT NULL,
        result_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (generation_id) REFERENCES generation_history(id)
      )
    `);
  }

  private async createShareRecordsTable(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS share_records (
        id TEXT PRIMARY KEY,
        generation_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT NOT NULL,
        FOREIGN KEY (generation_id) REFERENCES generation_history(id)
      )
    `);
  }

  private async createSystemMetricsTable(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id TEXT PRIMARY KEY,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private async createImageSearchHistoryTable(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS image_search_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        query TEXT NOT NULL,
        provider TEXT NOT NULL,
        results_count INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        filters TEXT DEFAULT '{}'
      )
    `);

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS image_search_results (
        id TEXT PRIMARY KEY,
        search_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        thumbnail_url TEXT,
        source_url TEXT,
        title TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        saved BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (search_id) REFERENCES image_search_history(id)
      )
    `);
  }

  private async addIndexes(): Promise<void> {
    // 为常用查询添加索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON generation_history(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_generation_history_created_at ON generation_history(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_generation_history_model ON generation_history(model)',
      'CREATE INDEX IF NOT EXISTS idx_batch_jobs_user_id ON batch_jobs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status)',
      'CREATE INDEX IF NOT EXISTS idx_edit_history_generation_id ON edit_history(generation_id)',
      'CREATE INDEX IF NOT EXISTS idx_share_records_generation_id ON share_records(generation_id)',
      'CREATE INDEX IF NOT EXISTS idx_share_records_user_id ON share_records(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_system_metrics_name_time ON system_metrics(metric_name, recorded_at)',
      'CREATE INDEX IF NOT EXISTS idx_image_search_history_user_id ON image_search_history(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_image_search_history_created_at ON image_search_history(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_image_search_results_search_id ON image_search_results(search_id)'
    ];

    for (const indexSql of indexes) {
      await this.db.exec(indexSql);
    }
  }

  private async updateEditHistoryTable(): Promise<void> {
    // Check if columns already exist to avoid errors
    const tableInfo = await this.db.all<any>('PRAGMA table_info(edit_history)');
    const columnNames = tableInfo.map(col => col.name);
    
    // Add original_url column if it doesn't exist
    if (!columnNames.includes('original_url')) {
      await this.db.exec('ALTER TABLE edit_history ADD COLUMN original_url TEXT');
    }
    
    // Add user_id column if it doesn't exist
    if (!columnNames.includes('user_id')) {
      await this.db.exec('ALTER TABLE edit_history ADD COLUMN user_id TEXT');
    }
    
    // Create index for user_id if it doesn't exist
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_edit_history_user_id ON edit_history(user_id)');
  }

  private async createUserAnalyticsTables(): Promise<void> {
    // 创建用户分析指标表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_analytics (
        id TEXT PRIMARY KEY,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        metric_date TEXT NOT NULL,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建用户会话表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        duration_seconds INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // 为用户分析表添加索引
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_user_analytics_name_date ON user_analytics(metric_name, metric_date)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_user_analytics_recorded_at ON user_analytics(recorded_at)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_user_sessions_platform ON user_sessions(platform)');
    await this.db.exec('CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at)');
  }

  private async updateImageSearchHistoryTable(): Promise<void> {
    // 添加新字段到 image_search_history 表
    try {
      await this.db.exec(`
        ALTER TABLE image_search_history 
        ADD COLUMN search_type TEXT DEFAULT 'text'
      `);
    } catch (error) {
      // 字段可能已存在，忽略错误
    }

    try {
      await this.db.exec(`
        ALTER TABLE image_search_history 
        ADD COLUMN image_url TEXT
      `);
    } catch (error) {
      // 字段可能已存在，忽略错误
    }
  }
}

// 辅助函数：运行迁移
export async function runDatabaseMigrations(env: Env): Promise<void> {
  const migrations = new DatabaseMigrations(env);
  await migrations.runMigrations();
}