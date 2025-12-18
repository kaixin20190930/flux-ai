#!/usr/bin/env tsx
/**
 * Application Startup Test
 * 
 * Tests that the application can start successfully with valid environment variables.
 * Requirements: 1.1, 1.2, 1.5, 5.5
 */

import { resolve } from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`.env.local not found at ${filePath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      process.env[key] = value;
    }
  }
}

async function testApplicationStartup() {
  console.log('='.repeat(60));
  console.log('Application Startup Test');
  console.log('='.repeat(60));
  console.log();

  try {
    // Step 1: Load environment variables
    console.log('Step 1: Loading environment variables from .env.local...');
    loadEnvFile(resolve(process.cwd(), '.env.local'));
    console.log('✅ Environment variables loaded');
    console.log();

    // Step 2: Validate environment variables
    console.log('Step 2: Validating required environment variables...');
    const { validateEnv } = await import('../lib/env-validator');
    const envVars = validateEnv();
    console.log('✅ All required environment variables validated');
    console.log();

    // Step 3: Initialize Prisma client
    console.log('Step 3: Initializing Prisma client...');
    const { prisma } = await import('../lib/prisma');
    console.log('✅ Prisma client initialized');
    console.log();

    // Step 4: Test database connection
    console.log('Step 4: Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    const url = new URL(process.env.DATABASE_URL!);
    console.log(`   Host: ${url.host}`);
    console.log(`   Database: ${url.pathname.substring(1)}`);
    console.log();

    // Step 5: Test database query
    console.log('Step 5: Testing database query...');
    const userCount = await prisma.user.count();
    console.log(`✅ Database query successful (${userCount} users found)`);
    console.log();

    // Step 6: Verify no hardcoded values
    console.log('Step 6: Verifying no hardcoded values...');
    const prismaContent = fs.readFileSync(resolve(process.cwd(), 'lib/prisma.ts'), 'utf-8');
    
    const hasHardcodedUrl = /const.*DATABASE_URL.*=.*["']postgresql:\/\//i.test(prismaContent);
    const hasNeonConstant = /const.*NEON_DATABASE_URL/i.test(prismaContent);
    const hasDatasourceOverride = /datasources:.*url:/i.test(prismaContent);
    
    if (hasHardcodedUrl || hasNeonConstant || hasDatasourceOverride) {
      console.log('❌ Found hardcoded values in lib/prisma.ts');
      if (hasHardcodedUrl) console.log('   - Hardcoded DATABASE_URL');
      if (hasNeonConstant) console.log('   - NEON_DATABASE_URL constant');
      if (hasDatasourceOverride) console.log('   - Datasource override');
      process.exit(1);
    }
    
    console.log('✅ No hardcoded values found');
    console.log();

    // Cleanup
    await prisma.$disconnect();

    // Success!
    console.log('='.repeat(60));
    console.log('✅ Application Startup Test PASSED');
    console.log('='.repeat(60));
    console.log();
    console.log('Summary:');
    console.log('  ✓ Environment variables loaded from .env.local');
    console.log('  ✓ All required variables validated');
    console.log('  ✓ Prisma client initialized successfully');
    console.log('  ✓ Database connection established');
    console.log('  ✓ Database queries work correctly');
    console.log('  ✓ No hardcoded configuration values');
    console.log();
    console.log('The application is ready to start! 🚀');
    console.log();

    process.exit(0);

  } catch (error: any) {
    console.log();
    console.log('='.repeat(60));
    console.log('❌ Application Startup Test FAILED');
    console.log('='.repeat(60));
    console.log();
    console.log('Error:', error.message);
    console.log();
    
    if (error.stack) {
      console.log('Stack trace:');
      console.log(error.stack);
    }
    
    process.exit(1);
  }
}

testApplicationStartup();
