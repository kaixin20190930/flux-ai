#!/usr/bin/env tsx

/**
 * Script to run Prisma migration manually
 * This is a workaround for npm cache issues
 */

import { readFileSync } from 'fs';
import { Client } from 'pg';
import { resolve } from 'path';

// Load environment variables manually
function loadEnvFile(path: string): void {
  try {
    const envContent = readFileSync(path, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value.trim();
        }
      }
    });
  } catch (error) {
    // Ignore if file doesn't exist
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'));

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('Please set it in your .env.local file');
  process.exit(1);
}

async function runMigration() {
  console.log('🔧 Running Prisma Migration...\n');
  console.log(`📊 Database URL: ${DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}\n`);

  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    // Connect to database
    console.log('🔍 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ PostgreSQL connection successful\n');

    // Read migration SQL
    const migrationSQL = readFileSync(
      resolve(process.cwd(), 'prisma/migrations/20241204_init/migration.sql'),
      'utf-8'
    );

    // Run migration
    console.log('🚀 Running migration SQL...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully!\n');

    // Verify tables
    console.log('📋 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\nCreated tables:');
    result.rows.forEach((row) => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('\n✨ Database setup complete!');
  } catch (error: any) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\nPlease ensure:');
      console.error('  1. PostgreSQL is running');
      console.error('  2. DATABASE_URL in .env.local is correct');
      console.error('  3. Database exists');
    } else if (error.code === '42P07') {
      console.error('\n⚠️  Tables already exist. This might be okay if you\'ve run this before.');
      console.error('To start fresh, drop the tables first or use a new database.');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
