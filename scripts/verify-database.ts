#!/usr/bin/env tsx

/**
 * Script to verify database tables after migration
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

async function verifyDatabase() {
  console.log('🔍 Verifying Database Setup...\n');

  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Check for required tables
    const expectedTables = ['users', 'accounts', 'sessions', 'verification_tokens'];
    
    console.log('📋 Checking for required tables...\n');

    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY($1)
      ORDER BY table_name;
    `, [expectedTables]);

    const foundTables = result.rows.map(row => row.table_name);
    const missingTables = expectedTables.filter(t => !foundTables.includes(t));

    if (missingTables.length === 0) {
      console.log('✅ All required tables exist:');
      foundTables.forEach(table => {
        console.log(`   ✓ ${table}`);
      });
      console.log('\n✨ Database verification successful!');
      
      // Show table details
      console.log('\n📊 Table Details:\n');
      
      for (const table of foundTables) {
        const columns = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position;
        `, [table]);
        
        console.log(`${table}:`);
        columns.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          console.log(`  - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
        });
        console.log('');
      }
      
    } else {
      console.log('❌ Missing tables:');
      missingTables.forEach(table => {
        console.log(`   ✗ ${table}`);
      });
      console.log('\n⚠️  Please run the migration first:');
      console.log('   npx prisma migrate dev --name init');
      console.log('   OR');
      console.log('   tsx scripts/run-prisma-migration.ts');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n❌ Verification failed:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\nPlease ensure:');
      console.error('  1. PostgreSQL is running');
      console.error('  2. DATABASE_URL in .env.local is correct');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyDatabase();
