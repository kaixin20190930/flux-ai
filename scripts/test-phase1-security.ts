#!/usr/bin/env ts-node

/**
 * Phase 1 Security Testing Script
 * 
 * This script tests the core security improvements:
 * 1. Database-driven usage tracking
 * 2. Multi-layer defense (IP + fingerprint + user)
 * 3. Secure points system
 * 
 * Usage:
 *   npm run test:security
 *   or
 *   ts-node scripts/test-phase1-security.ts
 */

import { Database } from '../utils/db';
import { usageTrackingService } from '../utils/usageTrackingService';
import { securePointsService } from '../utils/securePointsService';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (details) {
    console.log(`   Details:`, details);
  }
}

async function testDatabaseTables() {
  console.log('\n📊 Testing Database Tables...\n');
  
  const db = new Database(process.env as any);
  
  const requiredTables = [
    'usage_tracking',
    'ip_blocks',
    'fingerprint_tracking',
    'security_events',
    'points_transactions',
    'rate_limits',
    'abuse_patterns'
  ];

  for (const table of requiredTables) {
    try {
      await db.get(`SELECT COUNT(*) as count FROM ${table}`);
      logTest(
        `Table: ${table}`,
        true,
        'Exists and accessible'
      );
    } catch (error) {
      logTest(
        `Table: ${table}`,
        false,
        'Not found or inaccessible',
        { error: (error as Error).message }
      );
    }
  }
}

async function testUsageTracking() {
  console.log('\n🔍 Testing Usage Tracking Service...\n');

  const testIP = '192.168.1.100';
  const testFingerprint = 'test_fingerprint_' + Date.now();
  
  try {
    // Test 1: Check usage limit (should be allowed initially)
    const check1 = await usageTrackingService.checkUsageLimit(
      testFingerprint,
      testIP,
      null
    );
    
    logTest(
      'Initial usage check',
      check1.allowed && check1.remaining === 3,
      `Allowed: ${check1.allowed}, Remaining: ${check1.remaining}`,
      check1.details
    );

    // Test 2: Record a generation
    await usageTrackingService.recordGeneration(
      testFingerprint,
      testIP,
      null,
      'test-user-agent'
    );
    
    logTest(
      'Record generation',
      true,
      'Generation recorded successfully'
    );

    // Test 3: Check usage limit again (should have 2 remaining)
    const check2 = await usageTrackingService.checkUsageLimit(
      testFingerprint,
      testIP,
      null
    );
    
    logTest(
      'Usage check after generation',
      check2.allowed && check2.remaining === 2,
      `Allowed: ${check2.allowed}, Remaining: ${check2.remaining}`,
      check2.details
    );

    // Test 4: Record 2 more generations to reach limit
    await usageTrackingService.recordGeneration(testFingerprint, testIP, null);
    await usageTrackingService.recordGeneration(testFingerprint, testIP, null);

    // Test 5: Check usage limit (should be denied)
    const check3 = await usageTrackingService.checkUsageLimit(
      testFingerprint,
      testIP,
      null
    );
    
    logTest(
      'Usage check at limit',
      !check3.allowed && check3.remaining === 0,
      `Allowed: ${check3.allowed}, Remaining: ${check3.remaining}`,
      check3.details
    );

    // Test 6: Test IP-only tracking (simulating cookie deletion)
    const check4 = await usageTrackingService.checkUsageLimit(
      null, // No fingerprint (cookie deleted)
      testIP,
      null
    );
    
    logTest(
      'IP tracking after cookie deletion',
      !check4.allowed,
      `Still blocked via IP: ${!check4.allowed}`,
      { trackingMethod: check4.trackingMethod, details: check4.details }
    );

  } catch (error) {
    logTest(
      'Usage tracking test',
      false,
      'Error during testing',
      { error: (error as Error).message }
    );
  }
}

async function testPointsSystem() {
  console.log('\n💰 Testing Secure Points System...\n');

  // Create a test user
  const db = new Database(process.env as any);
  const testUserId = 'test_user_' + Date.now();
  
  try {
    // Create test user
    await db.run(`
      INSERT INTO users (id, name, email, points, status)
      VALUES (?, ?, ?, ?, ?)
    `, [testUserId, 'Test User', `test${Date.now()}@example.com`, 100, 'active']);

    logTest(
      'Create test user',
      true,
      'Test user created with 100 points'
    );

    // Test 1: Get balance
    const balance1 = await securePointsService.getBalance(testUserId);
    logTest(
      'Get initial balance',
      balance1 === 100,
      `Balance: ${balance1}`,
      { expected: 100, actual: balance1 }
    );

    // Test 2: Deduct points
    const deduct1 = await securePointsService.deductPoints(
      testUserId,
      30,
      'test_generation',
      'test_gen_id'
    );
    
    logTest(
      'Deduct points',
      deduct1.success && deduct1.newBalance === 70,
      `Success: ${deduct1.success}, New balance: ${deduct1.newBalance}`,
      deduct1
    );

    // Test 3: Verify transaction log
    const history = await securePointsService.getHistory(testUserId, 10);
    logTest(
      'Transaction log',
      history.transactions.length > 0,
      `Found ${history.transactions.length} transactions`,
      { totalSpent: history.totalSpent, currentBalance: history.currentBalance }
    );

    // Test 4: Try to deduct more than available
    const deduct2 = await securePointsService.deductPoints(
      testUserId,
      100,
      'test_generation'
    );
    
    logTest(
      'Insufficient points protection',
      !deduct2.success,
      `Correctly rejected: ${!deduct2.success}`,
      { error: deduct2.error }
    );

    // Test 5: Add points
    const add1 = await securePointsService.addPoints(
      testUserId,
      50,
      'test_bonus'
    );
    
    logTest(
      'Add points',
      add1.success && add1.newBalance === 120,
      `Success: ${add1.success}, New balance: ${add1.newBalance}`,
      add1
    );

    // Test 6: Verify transaction integrity
    const transactions = await securePointsService.getHistory(testUserId, 100);
    let allValid = true;
    
    for (const tx of transactions.transactions) {
      const expectedBalance = tx.balanceBefore + tx.amount;
      if (expectedBalance !== tx.balanceAfter) {
        allValid = false;
        break;
      }
    }
    
    logTest(
      'Transaction integrity',
      allValid,
      `All ${transactions.transactions.length} transactions are valid`,
      { transactionCount: transactions.transactions.length }
    );

    // Test 7: Detect manipulation
    const manipulation = await securePointsService.detectManipulation(testUserId);
    logTest(
      'Manipulation detection',
      !manipulation.suspicious,
      `No suspicious activity detected`,
      manipulation
    );

    // Cleanup
    await db.run(`DELETE FROM users WHERE id = ?`, [testUserId]);
    await db.run(`DELETE FROM points_transactions WHERE user_id = ?`, [testUserId]);

  } catch (error) {
    logTest(
      'Points system test',
      false,
      'Error during testing',
      { error: (error as Error).message }
    );
    
    // Cleanup on error
    try {
      await db.run(`DELETE FROM users WHERE id = ?`, [testUserId]);
      await db.run(`DELETE FROM points_transactions WHERE user_id = ?`, [testUserId]);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

async function testConcurrentPoints() {
  console.log('\n⚡ Testing Concurrent Points Operations...\n');

  const db = new Database(process.env as any);
  const testUserId = 'test_concurrent_' + Date.now();
  
  try {
    // Create test user with 100 points
    await db.run(`
      INSERT INTO users (id, name, email, points, status)
      VALUES (?, ?, ?, ?, ?)
    `, [testUserId, 'Concurrent Test', `concurrent${Date.now()}@example.com`, 100, 'active']);

    // Try to deduct points concurrently
    const promises = [
      securePointsService.deductPoints(testUserId, 30, 'concurrent_test_1'),
      securePointsService.deductPoints(testUserId, 30, 'concurrent_test_2'),
      securePointsService.deductPoints(testUserId, 30, 'concurrent_test_3')
    ];

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const finalBalance = await securePointsService.getBalance(testUserId);

    // Should have 3 successful deductions (100 - 90 = 10)
    // Or 3 successful and 1 failed if one was rejected
    const expectedBalance = 100 - (successCount * 30);
    
    logTest(
      'Concurrent deductions',
      finalBalance === expectedBalance && finalBalance >= 0,
      `${successCount} successful, final balance: ${finalBalance}`,
      { 
        successCount, 
        expectedBalance, 
        actualBalance: finalBalance,
        results: results.map(r => ({ success: r.success, balance: r.newBalance }))
      }
    );

    // Cleanup
    await db.run(`DELETE FROM users WHERE id = ?`, [testUserId]);
    await db.run(`DELETE FROM points_transactions WHERE user_id = ?`, [testUserId]);

  } catch (error) {
    logTest(
      'Concurrent points test',
      false,
      'Error during testing',
      { error: (error as Error).message }
    );
    
    // Cleanup
    try {
      await db.run(`DELETE FROM users WHERE id = ?`, [testUserId]);
      await db.run(`DELETE FROM points_transactions WHERE user_id = ?`, [testUserId]);
    } catch (cleanupError) {
      // Ignore
    }
  }
}

async function testIPHashing() {
  console.log('\n🔐 Testing IP Hashing...\n');

  try {
    const testIP = '192.168.1.100';
    
    // Hash the same IP twice
    const hash1 = await usageTrackingService['hashIP'](testIP);
    const hash2 = await usageTrackingService['hashIP'](testIP);
    
    logTest(
      'IP hashing consistency',
      hash1 === hash2,
      'Same IP produces same hash',
      { hash1: hash1.substring(0, 16) + '...', hash2: hash2.substring(0, 16) + '...' }
    );

    // Hash different IPs
    const hash3 = await usageTrackingService['hashIP']('192.168.1.101');
    
    logTest(
      'IP hashing uniqueness',
      hash1 !== hash3,
      'Different IPs produce different hashes',
      { 
        ip1Hash: hash1.substring(0, 16) + '...', 
        ip2Hash: hash3.substring(0, 16) + '...' 
      }
    );

  } catch (error) {
    logTest(
      'IP hashing test',
      false,
      'Error during testing',
      { error: (error as Error).message }
    );
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Pass Rate: ${passRate}%\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.message}`);
    });
    console.log('');
  }

  if (passRate === '100.0') {
    console.log('🎉 All tests passed! Phase 1 security improvements are working correctly.\n');
    console.log('Next steps:');
    console.log('  1. Test manually in the browser');
    console.log('  2. Monitor logs for any issues');
    console.log('  3. Deploy to production with monitoring');
    console.log('  4. Prepare for Phase 2 (browser fingerprinting)\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    console.log('Troubleshooting:');
    console.log('  1. Check if database migration ran successfully');
    console.log('  2. Verify environment variables are set');
    console.log('  3. Check database file permissions');
    console.log('  4. Review error details above\n');
  }
}

async function runAllTests() {
  console.log('🔒 Phase 1 Security Testing');
  console.log('='.repeat(60));
  console.log('Testing database-driven usage tracking and secure points system\n');

  try {
    await testDatabaseTables();
    await testUsageTracking();
    await testPointsSystem();
    await testConcurrentPoints();
    await testIPHashing();
    
    await printSummary();

  } catch (error) {
    console.error('\n💥 Fatal error during testing:', error);
    process.exit(1);
  }
}

// Run all tests
runAllTests()
  .then(() => {
    const failed = results.filter(r => !r.passed).length;
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
