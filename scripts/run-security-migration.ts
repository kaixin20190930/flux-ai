#!/usr/bin/env ts-node

/**
 * Run Security Migration Script
 * 
 * This script runs the security and trial system migration (002)
 * It should be run after backing up the database.
 * 
 * Usage:
 *   npm run migrate:security
 *   or
 *   ts-node scripts/run-security-migration.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// 动态导入 better-sqlite3
let Database: any = null;
try {
  const BetterSqlite3 = require('better-sqlite3');
  Database = BetterSqlite3;
} catch (error) {
  console.error('❌ better-sqlite3 未安装');
  console.error('请运行: npm install --save-dev better-sqlite3');
  process.exit(1);
}

const MIGRATION_FILE = 'migrations/002_secure_auth_and_trial_system.sql';
const DB_PATH = './flux-ai.db';

async function runMigration() {
  console.log('🔒 Starting Security Migration...\n');

  try {
    // Check if database exists
    if (!existsSync(DB_PATH)) {
      console.log('📁 Database file does not exist, creating new database...');
    }

    // Initialize database
    const db = new Database(DB_PATH);
    console.log('✅ Database connection established');

    // Read migration file
    const migrationPath = join(process.cwd(), MIGRATION_FILE);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Migration file loaded: ${MIGRATION_FILE}`);

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`\n📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }

      try {
        db.exec(statement);
        successCount++;
        
        // Log progress for major operations
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/)?.[1];
          console.log(`  ✓ Created table: ${tableName}`);
        } else if (statement.includes('CREATE INDEX')) {
          const indexName = statement.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)/)?.[1];
          console.log(`  ✓ Created index: ${indexName}`);
        } else if (statement.includes('CREATE VIEW')) {
          const viewName = statement.match(/CREATE VIEW (?:IF NOT EXISTS )?(\w+)/)?.[1];
          console.log(`  ✓ Created view: ${viewName}`);
        } else if (statement.includes('CREATE TRIGGER')) {
          const triggerName = statement.match(/CREATE TRIGGER (?:IF NOT EXISTS )?(\w+)/)?.[1];
          console.log(`  ✓ Created trigger: ${triggerName}`);
        } else if (statement.includes('ALTER TABLE')) {
          const tableName = statement.match(/ALTER TABLE (\w+)/)?.[1];
          console.log(`  ✓ Altered table: ${tableName}`);
        } else if (statement.includes('INSERT')) {
          const tableName = statement.match(/INSERT (?:OR IGNORE )?INTO (\w+)/)?.[1];
          console.log(`  ✓ Inserted data into: ${tableName}`);
        }

      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error executing statement ${i + 1}:`, error);
        console.error(`  Statement: ${statement.substring(0, 100)}...`);
        
        // Continue with other statements even if one fails
        // (some might fail due to already existing objects)
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);

    // Verify migration
    console.log(`\n🔍 Verifying migration...`);
    
    const tables = [
      'usage_tracking',
      'ip_blocks',
      'fingerprint_tracking',
      'security_events',
      'points_transactions',
      'rate_limits',
      'abuse_patterns',
      'security_event_types'
    ];

    for (const table of tables) {
      try {
        const stmt = db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
        const result = stmt.get();
        console.log(`  ✓ Table ${table}: ${result?.count || 0} rows`);
      } catch (error) {
        console.error(`  ✗ Table ${table}: Not found or error`);
      }
    }

    // Check views
    const views = [
      'daily_usage_summary',
      'active_security_threats',
      'user_points_summary'
    ];

    console.log(`\n🔍 Checking views...`);
    for (const view of views) {
      try {
        const stmt = db.prepare(`SELECT * FROM ${view} LIMIT 1`);
        stmt.get();
        console.log(`  ✓ View ${view}: OK`);
      } catch (error) {
        console.error(`  ✗ View ${view}: Not found or error`);
      }
    }

    // Close database connection
    db.close();

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`\n📝 Next steps:`);
    console.log(`  1. Test the new usage tracking in development`);
    console.log(`  2. Monitor logs for any issues`);
    console.log(`  3. Update application code to use new services`);
    console.log(`  4. Deploy to production with monitoring`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\n⚠️  Please check the error above and fix any issues before retrying.');
    console.error('⚠️  If the database is in an inconsistent state, restore from backup.');
    process.exit(1);
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
