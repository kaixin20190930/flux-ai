#!/usr/bin/env ts-node
/**
 * Environment Variable Loading Test
 * 
 * Tests that environment variables are correctly loaded and validated.
 * Requirements: 1.1, 1.2, 1.5, 5.5
 */

import { resolve } from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
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

// Load .env.local before running tests
loadEnvFile(resolve(process.cwd(), '.env.local'));

// Test results tracking
const results: { test: string; passed: boolean; message: string }[] = [];

function logTest(test: string, passed: boolean, message: string) {
  results.push({ test, passed, message });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${test}`);
  if (message) {
    console.log(`   ${message}`);
  }
}

async function testEnvironmentVariableLoading() {
  console.log('='.repeat(60));
  console.log('Environment Variable Loading Test');
  console.log('='.repeat(60));
  console.log();

  // Test 1: Check .env.local file exists
  console.log('Test 1: Checking .env.local file...');
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const exists = fs.existsSync(envPath);
    
    if (!exists) {
      logTest('Load .env.local', false, `.env.local file not found at ${envPath}`);
    } else {
      logTest('Load .env.local', true, `Found at ${envPath}`);
      
      // Check if it contains DATABASE_URL
      const content = fs.readFileSync(envPath, 'utf-8');
      if (content.includes('DATABASE_URL')) {
        logTest('.env.local has DATABASE_URL', true, 'DATABASE_URL is defined in .env.local');
      } else {
        logTest('.env.local has DATABASE_URL', false, 'DATABASE_URL not found in .env.local');
      }
    }
  } catch (error) {
    logTest('Load .env.local', false, `Error: ${error}`);
  }
  console.log();

  // Test 2: Verify DATABASE_URL is loaded from environment
  console.log('Test 2: Verifying DATABASE_URL is loaded...');
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    logTest('DATABASE_URL loaded', false, 'DATABASE_URL is not defined in environment');
  } else {
    logTest('DATABASE_URL loaded', true, `Found: ${databaseUrl.substring(0, 30)}...`);
    
    // Verify it's not a hardcoded example value
    if (databaseUrl.includes('user:password@host') || databaseUrl.includes('example.com')) {
      logTest('DATABASE_URL not hardcoded', false, 'DATABASE_URL appears to be a placeholder value');
    } else {
      logTest('DATABASE_URL not hardcoded', true, 'DATABASE_URL is a real connection string');
    }
  }
  console.log();

  // Test 3: Verify Prisma can connect to correct database
  console.log('Test 3: Testing Prisma connection...');
  try {
    // Import Prisma client (this will validate DATABASE_URL)
    const { prisma } = await import('../lib/prisma');
    
    logTest('Prisma client initialization', true, 'Prisma client created successfully');
    
    // Test database connection
    await prisma.$connect();
    logTest('Database connection', true, 'Successfully connected to database');
    
    // Verify we're connecting to the right database
    const url = new URL(process.env.DATABASE_URL!);
    console.log(`   Connected to: ${url.host}`);
    console.log(`   Database: ${url.pathname.substring(1)}`);
    
    // Test a simple query
    const userCount = await prisma.user.count();
    logTest('Database query', true, `Found ${userCount} users in database`);
    
    await prisma.$disconnect();
  } catch (error: any) {
    logTest('Prisma connection', false, `Error: ${error.message}`);
  }
  console.log();

  // Test 4: Verify environment validator works
  console.log('Test 4: Testing environment validator...');
  try {
    const { validateEnv } = await import('../lib/env-validator');
    const envVars = validateEnv();
    
    logTest('Environment validator', true, 'All required variables validated');
    
    // Check each required variable
    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ];
    
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        console.log(`   ✓ ${varName}: present`);
      } else {
        console.log(`   ✗ ${varName}: missing`);
      }
    }
  } catch (error: any) {
    logTest('Environment validator', false, `Error: ${error.message}`);
  }
  console.log();

  // Test 5: Verify no hardcoded values in Prisma client
  console.log('Test 5: Checking for hardcoded values...');
  try {
    const prismaContent = fs.readFileSync(resolve(process.cwd(), 'lib/prisma.ts'), 'utf-8');
    
    // Check for hardcoded database URLs
    const hardcodedPatterns = [
      /const.*DATABASE_URL.*=.*["']postgresql:\/\//i,
      /const.*NEON_DATABASE_URL/i,
      /datasources:.*url:/i,
    ];
    
    let foundHardcoded = false;
    for (const pattern of hardcodedPatterns) {
      if (pattern.test(prismaContent)) {
        foundHardcoded = true;
        logTest('No hardcoded values', false, `Found potential hardcoded value matching: ${pattern}`);
        break;
      }
    }
    
    if (!foundHardcoded) {
      logTest('No hardcoded values', true, 'No hardcoded database URLs found in lib/prisma.ts');
    }
    
    // Verify it uses process.env.DATABASE_URL
    if (prismaContent.includes('process.env.DATABASE_URL')) {
      logTest('Uses process.env', true, 'Prisma client uses process.env.DATABASE_URL');
    } else {
      logTest('Uses process.env', false, 'Prisma client does not reference process.env.DATABASE_URL');
    }
  } catch (error: any) {
    logTest('Hardcoded values check', false, `Error: ${error.message}`);
  }
  console.log();

  // Summary
  console.log('='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log(`Passed: ${passed}/${total} (${percentage}%)`);
  console.log();
  
  if (passed === total) {
    console.log('✅ All tests passed!');
    console.log();
    console.log('Environment variable loading is working correctly:');
    console.log('  ✓ .env.local is loaded');
    console.log('  ✓ DATABASE_URL is read from environment');
    console.log('  ✓ Prisma connects to correct database');
    console.log('  ✓ No hardcoded values are used');
    console.log('  ✓ Environment validator works');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    console.log();
    console.log('Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.test}: ${r.message}`);
    });
    process.exit(1);
  }
}

// Run tests
testEnvironmentVariableLoading().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
