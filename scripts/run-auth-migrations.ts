#!/usr/bin/env tsx

/**
 * Authentication Database Migration Script
 * 
 * This script runs the authentication-related database migrations
 * to update the user table structure and create the auth_sessions table.
 * 
 * Usage:
 *   npm run migrate:auth
 *   or
 *   tsx scripts/run-auth-migrations.ts
 */

import { runAuthMigrations, checkAuthMigrationStatus } from '../utils/authMigrations';
import { Env } from '@/worker/types';

// Mock environment for local development
const mockEnv: Env = {
  DB: undefined, // Will be set based on environment
  'DB-DEV': undefined, // Local development database
  JWT_SECRET: process.env.JWT_SECRET || 'development-secret-key',
  ENVIRONMENT: (process.env.NODE_ENV as 'development' | 'production') || 'development'
};

async function main() {
  console.log('🔄 Starting authentication database migrations...\n');

  try {
    // Check current migration status
    console.log('📋 Checking current migration status...');
    const status = await checkAuthMigrationStatus(mockEnv);
    
    console.log(`Migration needed: ${status.needsMigration}`);
    if (status.missingColumns.length > 0) {
      console.log(`Missing columns: ${status.missingColumns.join(', ')}`);
    }
    if (status.missingTables.length > 0) {
      console.log(`Missing tables: ${status.missingTables.join(', ')}`);
    }

    if (!status.needsMigration) {
      console.log('✅ Database is already up to date!');
      return;
    }

    console.log('\n🚀 Running migrations...');
    
    // Run migrations
    const result = await runAuthMigrations(mockEnv);
    
    if (result.success) {
      console.log('\n✅ Migrations completed successfully!');
      console.log(`Applied migrations: ${result.migrationsApplied.join(', ')}`);
      console.log(`Message: ${result.message}`);
    } else {
      console.error('\n❌ Migration failed!');
      console.error(`Message: ${result.message}`);
      if (result.errors) {
        console.error('Errors:');
        result.errors.forEach(error => console.error(`  - ${error}`));
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 Unexpected error during migration:');
    console.error(error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'check':
    // Only check migration status
    checkAuthMigrationStatus(mockEnv)
      .then(status => {
        console.log('Migration Status:', status);
        process.exit(status.needsMigration ? 1 : 0);
      })
      .catch(error => {
        console.error('Error checking migration status:', error);
        process.exit(1);
      });
    break;
    
  case 'rollback':
    console.log('⚠️  Rollback functionality is limited in SQLite');
    console.log('Please backup your database before running migrations');
    break;
    
  default:
    // Run migrations
    main();
}

// Export for programmatic use
export { main as runMigrations };