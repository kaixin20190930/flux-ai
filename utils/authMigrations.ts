import { Database } from './db';
import { Env } from '@/worker/types';
import { AppErrorClass, ErrorCode } from '@/types/database';

export interface MigrationResult {
  success: boolean;
  message: string;
  migrationsApplied: string[];
  errors?: string[];
}

export class AuthMigrations {
  private db: Database;

  constructor(env: Env) {
    this.db = new Database(env);
  }

  /**
   * Run all authentication-related migrations
   */
  async runMigrations(): Promise<MigrationResult> {
    const migrationsApplied: string[] = [];
    const errors: string[] = [];

    try {
      // Migration 1: Update users table structure
      await this.migrateUsersTable();
      migrationsApplied.push('users_table_update');

      // Migration 2: Create auth_sessions table
      await this.createAuthSessionsTable();
      migrationsApplied.push('auth_sessions_table_creation');

      // Migration 3: Create indexes
      await this.createIndexes();
      migrationsApplied.push('indexes_creation');

      // Migration 4: Migrate existing data
      await this.migrateExistingData();
      migrationsApplied.push('data_migration');

      return {
        success: true,
        message: 'All migrations completed successfully',
        migrationsApplied
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      
      return {
        success: false,
        message: `Migration failed: ${errorMessage}`,
        migrationsApplied,
        errors
      };
    }
  }

  /**
   * Update users table structure
   */
  private async migrateUsersTable(): Promise<void> {
    try {
      // Check if the new columns already exist
      const tableInfo = await this.db.all<any>('PRAGMA table_info(users)');
      const columnNames = tableInfo.map((col: any) => col.name);

      const newColumns = [
        { name: 'is_google_user', type: 'INTEGER', default: '0' },
        { name: 'google_id', type: 'TEXT', default: 'NULL' },
        { name: 'status', type: 'TEXT', default: "'active'" },
        { name: 'last_login_at', type: 'DATETIME', default: 'NULL' }
      ];

      // Add missing columns
      for (const column of newColumns) {
        if (!columnNames.includes(column.name)) {
          const sql = `ALTER TABLE users ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.default}`;
          await this.db.exec(sql);
          console.log(`Added column ${column.name} to users table`);
        }
      }

      // Update existing users to have active status if null
      await this.db.run(`
        UPDATE users 
        SET status = 'active' 
        WHERE status IS NULL OR status = ''
      `);

      // Rename password_hash column if it exists as password
      if (columnNames.includes('password') && !columnNames.includes('password_hash')) {
        // SQLite doesn't support column renaming directly, so we need to recreate the table
        await this.recreateUsersTableWithNewSchema();
      }

    } catch (error) {
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to migrate users table',
        details: { error: (error as Error).message },
        timestamp: new Date()
      });
    }
  }

  /**
   * Recreate users table with new schema (for column renaming)
   */
  private async recreateUsersTableWithNewSchema(): Promise<void> {
    // Create backup table
    await this.db.exec(`
      CREATE TABLE users_backup AS SELECT * FROM users
    `);

    // Drop original table
    await this.db.exec('DROP TABLE users');

    // Create new table with updated schema
    await this.db.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        is_google_user INTEGER DEFAULT 0,
        google_id TEXT,
        points INTEGER DEFAULT 50,
        status TEXT DEFAULT 'active',
        avatar_url TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        subscription_type TEXT DEFAULT 'free',
        subscription_expires_at DATETIME,
        total_generations INTEGER DEFAULT 0,
        remaining_generations INTEGER DEFAULT 10,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME
      )
    `);

    // Migrate data from backup
    await this.db.exec(`
      INSERT INTO users (
        id, name, email, password_hash, is_google_user, google_id, points, status,
        avatar_url, is_admin, subscription_type, subscription_expires_at,
        total_generations, remaining_generations, created_at, updated_at
      )
      SELECT 
        id, 
        COALESCE(name, 'User') as name,
        email, 
        COALESCE(password_hash, password) as password_hash,
        0 as is_google_user,
        NULL as google_id,
        COALESCE(points, 50) as points,
        'active' as status,
        avatar_url,
        COALESCE(is_admin, FALSE) as is_admin,
        COALESCE(subscription_type, 'free') as subscription_type,
        subscription_expires_at,
        COALESCE(total_generations, 0) as total_generations,
        COALESCE(remaining_generations, 10) as remaining_generations,
        COALESCE(created_at, CURRENT_TIMESTAMP) as created_at,
        COALESCE(updated_at, CURRENT_TIMESTAMP) as updated_at
      FROM users_backup
    `);

    // Drop backup table
    await this.db.exec('DROP TABLE users_backup');
  }

  /**
   * Create auth_sessions table
   */
  private async createAuthSessionsTable(): Promise<void> {
    try {
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS auth_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token_hash TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_agent TEXT,
          ip_address TEXT,
          is_active INTEGER DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);
      console.log('Created auth_sessions table');
    } catch (error) {
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to create auth_sessions table',
        details: { error: (error as Error).message },
        timestamp: new Date()
      });
    }
  }

  /**
   * Create necessary indexes
   */
  private async createIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)',
      'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
      'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token_hash)',
      'CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_auth_sessions_active ON auth_sessions(is_active)'
    ];

    try {
      for (const indexSql of indexes) {
        await this.db.exec(indexSql);
      }
      console.log('Created all indexes');
    } catch (error) {
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to create indexes',
        details: { error: (error as Error).message },
        timestamp: new Date()
      });
    }
  }

  /**
   * Migrate existing data to new format
   */
  private async migrateExistingData(): Promise<void> {
    try {
      // Update any users that don't have proper default values
      await this.db.run(`
        UPDATE users 
        SET 
          points = COALESCE(points, 50),
          status = COALESCE(status, 'active'),
          is_google_user = COALESCE(is_google_user, 0),
          updated_at = CURRENT_TIMESTAMP
        WHERE points IS NULL OR status IS NULL OR is_google_user IS NULL
      `);

      // Clean up any invalid data
      await this.db.run(`
        UPDATE users 
        SET status = 'active' 
        WHERE status NOT IN ('active', 'suspended', 'deleted')
      `);

      console.log('Migrated existing data');
    } catch (error) {
      throw new AppErrorClass({
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to migrate existing data',
        details: { error: (error as Error).message },
        timestamp: new Date()
      });
    }
  }

  /**
   * Check if migrations are needed
   */
  async checkMigrationStatus(): Promise<{
    needsMigration: boolean;
    missingColumns: string[];
    missingTables: string[];
  }> {
    try {
      // Check users table structure
      const userTableInfo = await this.db.all<any>('PRAGMA table_info(users)');
      const userColumns = userTableInfo.map((col: any) => col.name);
      
      const requiredUserColumns = [
        'is_google_user', 'google_id', 'status', 'last_login_at'
      ];
      
      const missingColumns = requiredUserColumns.filter(col => !userColumns.includes(col));

      // Check if auth_sessions table exists
      const tables = await this.db.all<any>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='auth_sessions'"
      );
      
      const missingTables = tables.length === 0 ? ['auth_sessions'] : [];

      return {
        needsMigration: missingColumns.length > 0 || missingTables.length > 0,
        missingColumns,
        missingTables
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return {
        needsMigration: true,
        missingColumns: [],
        missingTables: []
      };
    }
  }

  /**
   * Rollback migrations (for development/testing)
   */
  async rollbackMigrations(): Promise<MigrationResult> {
    try {
      // Drop auth_sessions table
      await this.db.exec('DROP TABLE IF EXISTS auth_sessions');

      // Note: Rolling back column additions in SQLite is complex
      // In production, you'd want to be more careful about this
      console.log('Rolled back auth_sessions table');

      return {
        success: true,
        message: 'Rollback completed successfully',
        migrationsApplied: ['rollback_auth_sessions']
      };
    } catch (error) {
      return {
        success: false,
        message: `Rollback failed: ${(error as Error).message}`,
        migrationsApplied: [],
        errors: [(error as Error).message]
      };
    }
  }
}

/**
 * Utility function to run migrations
 */
export async function runAuthMigrations(env: Env): Promise<MigrationResult> {
  const migrations = new AuthMigrations(env);
  return await migrations.runMigrations();
}

/**
 * Utility function to check migration status
 */
export async function checkAuthMigrationStatus(env: Env) {
  const migrations = new AuthMigrations(env);
  return await migrations.checkMigrationStatus();
}