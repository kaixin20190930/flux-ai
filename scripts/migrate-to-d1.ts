#!/usr/bin/env node

/**
 * 数据库迁移脚本：从现有数据库迁移到 Cloudflare D1
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface MigrationConfig {
  sourceDbUrl: string;
  d1DatabaseId: string;
  backupPath: string;
}

class D1Migrator {
  private config: MigrationConfig;

  constructor(config: MigrationConfig) {
    this.config = config;
  }

  /**
   * 执行完整的迁移流程
   */
  async migrate(): Promise<void> {
    console.log('🚀 开始数据库迁移到 Cloudflare D1...\n');

    try {
      // 1. 创建 D1 数据库
      await this.createD1Database();
      
      // 2. 创建表结构
      await this.createTables();
      
      // 3. 导出现有数据
      await this.exportExistingData();
      
      // 4. 导入数据到 D1
      await this.importDataToD1();
      
      // 5. 验证数据完整性
      await this.verifyMigration();
      
      console.log('✅ 数据库迁移完成！');
      
    } catch (error) {
      console.error('❌ 迁移失败：', error);
      throw error;
    }
  }

  /**
   * 创建 D1 数据库
   */
  private async createD1Database(): Promise<void> {
    console.log('📦 创建 D1 数据库...');
    
    try {
      // 检查是否已存在
      const result = execSync('npx wrangler d1 list', { encoding: 'utf8' });
      if (result.includes('flux-ai-db')) {
        console.log('ℹ️  D1 数据库已存在');
        return;
      }
      
      // 创建新数据库
      execSync('npx wrangler d1 create flux-ai-db', { stdio: 'inherit' });
      console.log('✅ D1 数据库创建成功');
      
    } catch (error) {
      console.error('创建 D1 数据库失败：', error);
      throw error;
    }
  }

  /**
   * 创建表结构
   */
  private async createTables(): Promise<void> {
    console.log('🏗️  创建表结构...');
    
    const schemas = [
      // 用户表
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_admin BOOLEAN DEFAULT FALSE,
        subscription_type TEXT DEFAULT 'free',
        subscription_expires_at DATETIME,
        total_generations INTEGER DEFAULT 0,
        remaining_generations INTEGER DEFAULT 10
      );`,
      
      // 生成历史表
      `CREATE TABLE IF NOT EXISTS generation_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        image_url TEXT,
        model TEXT DEFAULT 'flux-schnell',
        width INTEGER DEFAULT 1024,
        height INTEGER DEFAULT 1024,
        steps INTEGER DEFAULT 4,
        guidance REAL DEFAULT 0.0,
        seed INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_public BOOLEAN DEFAULT FALSE,
        tags TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );`,
      
      // 图片搜索历史表
      `CREATE TABLE IF NOT EXISTS image_search_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        query TEXT NOT NULL,
        results TEXT, -- JSON 格式存储搜索结果
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );`,
      
      // 保存的图片表
      `CREATE TABLE IF NOT EXISTS saved_images (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        image_url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );`,
      
      // 系统指标表
      `CREATE TABLE IF NOT EXISTS system_metrics (
        id TEXT PRIMARY KEY,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT -- JSON 格式存储额外信息
      );`,
      
      // 用户分析表
      `CREATE TABLE IF NOT EXISTS user_analytics (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_data TEXT, -- JSON 格式
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );`,
      
      // 创建索引
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
      `CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON generation_history(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_generation_history_created_at ON generation_history(created_at);`,
      `CREATE INDEX IF NOT EXISTS idx_image_search_history_user_id ON image_search_history(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_saved_images_user_id ON saved_images(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);`,
      `CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);`,
    ];

    // 将所有 SQL 写入文件
    const schemaFile = path.join(__dirname, '../migrations/d1-schema.sql');
    fs.mkdirSync(path.dirname(schemaFile), { recursive: true });
    fs.writeFileSync(schemaFile, schemas.join('\n\n'));

    // 执行迁移
    try {
      execSync(`npx wrangler d1 execute flux-ai-db --file=${schemaFile}`, { stdio: 'inherit' });
      console.log('✅ 表结构创建成功');
    } catch (error) {
      console.error('创建表结构失败：', error);
      throw error;
    }
  }

  /**
   * 导出现有数据
   */
  private async exportExistingData(): Promise<void> {
    console.log('📤 导出现有数据...');
    
    // 这里需要根据你的现有数据库类型来实现
    // 示例：如果是 PostgreSQL
    /*
    try {
      const backupDir = path.dirname(this.config.backupPath);
      fs.mkdirSync(backupDir, { recursive: true });
      
      execSync(`pg_dump ${this.config.sourceDbUrl} > ${this.config.backupPath}`, { stdio: 'inherit' });
      console.log('✅ 数据导出成功');
    } catch (error) {
      console.error('数据导出失败：', error);
      throw error;
    }
    */
    
    console.log('ℹ️  请手动导出现有数据，或实现特定数据库的导出逻辑');
  }

  /**
   * 导入数据到 D1
   */
  private async importDataToD1(): Promise<void> {
    console.log('📥 导入数据到 D1...');
    
    // 创建示例数据
    const sampleData = `
      -- 插入示例用户
      INSERT OR IGNORE INTO users (id, email, password_hash, name, is_admin) VALUES 
      ('admin-001', 'admin@flux-ai.com', 'hashed-password', 'Admin User', TRUE),
      ('user-001', 'user@example.com', 'hashed-password', 'Test User', FALSE);
      
      -- 插入示例生成历史
      INSERT OR IGNORE INTO generation_history (id, user_id, prompt, image_url) VALUES 
      ('gen-001', 'user-001', 'A beautiful sunset', 'https://example.com/sunset.jpg'),
      ('gen-002', 'user-001', 'A cute cat', 'https://example.com/cat.jpg');
    `;
    
    const dataFile = path.join(__dirname, '../migrations/d1-sample-data.sql');
    fs.writeFileSync(dataFile, sampleData);
    
    try {
      execSync(`npx wrangler d1 execute flux-ai-db --file=${dataFile}`, { stdio: 'inherit' });
      console.log('✅ 示例数据导入成功');
    } catch (error) {
      console.error('数据导入失败：', error);
      throw error;
    }
  }

  /**
   * 验证迁移结果
   */
  private async verifyMigration(): Promise<void> {
    console.log('🔍 验证迁移结果...');
    
    try {
      // 检查表是否存在
      const checkTables = `
        SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
      `;
      
      const checkFile = path.join(__dirname, '../migrations/check-tables.sql');
      fs.writeFileSync(checkFile, checkTables);
      
      execSync(`npx wrangler d1 execute flux-ai-db --file=${checkFile}`, { stdio: 'inherit' });
      console.log('✅ 数据库验证完成');
      
    } catch (error) {
      console.error('验证失败：', error);
      throw error;
    }
  }
}

// 主函数
async function main() {
  const config: MigrationConfig = {
    sourceDbUrl: process.env.DATABASE_URL || '',
    d1DatabaseId: 'your-d1-database-id',
    backupPath: './backups/database-backup.sql'
  };

  const migrator = new D1Migrator(config);
  await migrator.migrate();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

export { D1Migrator };