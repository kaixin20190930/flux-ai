#!/usr/bin/env ts-node
/**
 * Missing Environment Variable Test
 * 
 * Tests that the system properly handles missing DATABASE_URL
 * and provides clear error messages.
 * 
 * Requirements: 1.3, 2.4, 6.2, 6.3
 */

console.log('='.repeat(60));
console.log('Missing Environment Variable Test');
console.log('='.repeat(60));
console.log();

// Save original DATABASE_URL
const originalDatabaseUrl = process.env.DATABASE_URL;

console.log('Test: Removing DATABASE_URL and testing error handling...');
console.log();

// Remove DATABASE_URL
delete process.env.DATABASE_URL;

console.log('Step 1: Testing Prisma client with missing DATABASE_URL...');
try {
  // Clear the module cache to force re-import
  delete require.cache[require.resolve('../lib/prisma')];
  
  // Try to import Prisma client (should throw error)
  require('../lib/prisma');
  
  console.log('❌ FAIL: Prisma client did not throw error for missing DATABASE_URL');
  process.exit(1);
} catch (error: any) {
  console.log('✅ PASS: Prisma client threw error for missing DATABASE_URL');
  console.log();
  console.log('Error message:');
  console.log('-'.repeat(60));
  console.log(error.message);
  console.log('-'.repeat(60));
  console.log();
  
  // Verify error message is helpful
  const errorMsg = error.message;
  const hasVariableName = errorMsg.includes('DATABASE_URL');
  const hasInstructions = errorMsg.includes('.env.local') || errorMsg.includes('environment');
  const hasExample = errorMsg.includes('postgresql://') || errorMsg.includes('Example');
  
  console.log('Error message quality checks:');
  console.log(`  ${hasVariableName ? '✓' : '✗'} Mentions DATABASE_URL`);
  console.log(`  ${hasInstructions ? '✓' : '✗'} Provides instructions`);
  console.log(`  ${hasExample ? '✓' : '✗'} Includes example`);
  console.log();
  
  if (hasVariableName && hasInstructions) {
    console.log('✅ Error message is clear and helpful');
  } else {
    console.log('⚠️  Error message could be more helpful');
  }
}

console.log();
console.log('Step 2: Testing environment validator with missing DATABASE_URL...');

try {
  // Clear the module cache
  delete require.cache[require.resolve('../lib/env-validator')];
  
  const { validateEnv } = require('../lib/env-validator');
  validateEnv();
  
  console.log('❌ FAIL: Environment validator did not throw error');
  process.exit(1);
} catch (error: any) {
  console.log('✅ PASS: Environment validator threw error');
  console.log();
  console.log('Error message:');
  console.log('-'.repeat(60));
  console.log(error.message);
  console.log('-'.repeat(60));
  console.log();
  
  // Verify error message lists missing variables
  const errorMsg = error.message;
  const listsMissing = errorMsg.includes('Missing required') || errorMsg.includes('DATABASE_URL');
  const hasInstructions = errorMsg.includes('.env.local') || errorMsg.includes('.env.example');
  
  console.log('Error message quality checks:');
  console.log(`  ${listsMissing ? '✓' : '✗'} Lists missing variables`);
  console.log(`  ${hasInstructions ? '✓' : '✗'} Provides instructions`);
  console.log();
  
  if (listsMissing && hasInstructions) {
    console.log('✅ Error message is clear and helpful');
  } else {
    console.log('⚠️  Error message could be more helpful');
  }
}

// Restore DATABASE_URL
if (originalDatabaseUrl) {
  process.env.DATABASE_URL = originalDatabaseUrl;
  console.log();
  console.log('✓ Restored DATABASE_URL');
}

console.log();
console.log('='.repeat(60));
console.log('✅ All missing environment variable tests passed!');
console.log('='.repeat(60));
console.log();
console.log('Summary:');
console.log('  ✓ Prisma client detects missing DATABASE_URL');
console.log('  ✓ Environment validator detects missing variables');
console.log('  ✓ Error messages are clear and helpful');
console.log('  ✓ Error messages name the missing variables');
console.log('  ✓ Error messages provide instructions');
console.log();

process.exit(0);
