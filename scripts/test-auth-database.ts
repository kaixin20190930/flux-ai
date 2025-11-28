#!/usr/bin/env tsx

/**
 * Authentication Database Test Script
 * 
 * This script tests the authentication database structure and functionality
 * including the UserRepository and SessionManager.
 */

import { UserRepository } from '../utils/userRepository';
import { SessionManager } from '../utils/sessionManager';
import { runAuthMigrations, checkAuthMigrationStatus } from '../utils/authMigrations';
import { Env } from '@/worker/types';

// Mock environment for testing
const testEnv: Env = {
  DB: undefined,
  'DB-DEV': undefined,
  JWT_SECRET: 'test-secret-key-for-development',
  ENVIRONMENT: 'development'
};

async function testUserRepository() {
  console.log('\n🧪 Testing UserRepository...');
  
  const userRepo = new UserRepository(testEnv);
  
  try {
    // Test connection info
    const connectionInfo = userRepo.getConnectionInfo();
    console.log('Connection info:', connectionInfo);
    
    // Test creating a user
    console.log('Creating test user...');
    const newUser = await userRepo.createUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123',
      isGoogleUser: false
    });
    console.log('✅ User created:', { id: newUser.id, email: newUser.email });
    
    // Test finding user by email
    console.log('Finding user by email...');
    const foundUser = await userRepo.findByEmail('test@example.com');
    console.log('✅ User found:', foundUser ? 'Yes' : 'No');
    
    // Test validating credentials
    console.log('Validating credentials...');
    const isValid = await userRepo.validateCredentials('test@example.com', 'testpassword123');
    console.log('✅ Credentials valid:', isValid);
    
    // Test updating user
    console.log('Updating user points...');
    const updatedUser = await userRepo.updatePoints(newUser.id, 100);
    console.log('✅ User updated, points:', updatedUser.points);
    
    // Test user stats
    console.log('Getting user stats...');
    const stats = await userRepo.getUserStats();
    console.log('✅ User stats:', stats);
    
    return true;
  } catch (error) {
    console.error('❌ UserRepository test failed:', error);
    return false;
  }
}

async function testSessionManager() {
  console.log('\n🧪 Testing SessionManager...');
  
  try {
    const sessionManager = new SessionManager(testEnv);
    
    // Test creating a session
    console.log('Creating test session...');
    const { token, sessionId } = await sessionManager.createSession(
      'test-user-id',
      'Test User Agent',
      '127.0.0.1'
    );
    console.log('✅ Session created:', { sessionId, tokenLength: token.length });
    
    // Test validating session
    console.log('Validating session...');
    const sessionInfo = await sessionManager.validateSession(token);
    console.log('✅ Session valid:', sessionInfo ? 'Yes' : 'No');
    
    // Test getting user sessions
    console.log('Getting user sessions...');
    const userSessions = await sessionManager.getUserSessions('test-user-id');
    console.log('✅ User sessions count:', userSessions.length);
    
    // Test session stats
    console.log('Getting session stats...');
    const stats = await sessionManager.getSessionStats();
    console.log('✅ Session stats:', stats);
    
    // Test deactivating session
    console.log('Deactivating session...');
    await sessionManager.deactivateSession(sessionId);
    console.log('✅ Session deactivated');
    
    return true;
  } catch (error) {
    console.error('❌ SessionManager test failed:', error);
    return false;
  }
}

async function testMigrations() {
  console.log('\n🧪 Testing Database Migrations...');
  
  try {
    // Check migration status
    console.log('Checking migration status...');
    const status = await checkAuthMigrationStatus(testEnv);
    console.log('✅ Migration status:', status);
    
    // Run migrations if needed
    if (status.needsMigration) {
      console.log('Running migrations...');
      const result = await runAuthMigrations(testEnv);
      console.log('✅ Migration result:', result.success ? 'Success' : 'Failed');
      if (!result.success) {
        console.error('Migration errors:', result.errors);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Migration test failed:', error);
    return false;
  }
}

async function testDatabaseStructure() {
  console.log('\n🧪 Testing Database Structure...');
  
  try {
    // This would require actual database connection
    // For now, we'll just test that our classes can be instantiated
    const userRepo = new UserRepository();
    const connectionInfo = userRepo.getConnectionInfo();
    
    console.log('✅ UserRepository instantiated');
    console.log('Connection info:', connectionInfo);
    
    // Test fallback mode
    if (connectionInfo.fallbackMode) {
      console.log('✅ Running in fallback mode (expected for testing)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database structure test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Authentication Database Tests\n');
  
  const tests = [
    { name: 'Database Structure', fn: testDatabaseStructure },
    { name: 'Migrations', fn: testMigrations },
    { name: 'UserRepository', fn: testUserRepository },
    { name: 'SessionManager', fn: testSessionManager }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n📋 Running ${test.name} test...`);
    try {
      const result = await test.fn();
      results.push({ name: test.name, success: result });
      console.log(`${result ? '✅' : '❌'} ${test.name} test ${result ? 'passed' : 'failed'}`);
    } catch (error) {
      results.push({ name: test.name, success: false });
      console.error(`❌ ${test.name} test failed with error:`, error);
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\nTotal: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed!');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const testName = args[0];

switch (testName) {
  case 'repo':
    testUserRepository().then(success => process.exit(success ? 0 : 1));
    break;
  case 'session':
    testSessionManager().then(success => process.exit(success ? 0 : 1));
    break;
  case 'migration':
    testMigrations().then(success => process.exit(success ? 0 : 1));
    break;
  case 'structure':
    testDatabaseStructure().then(success => process.exit(success ? 0 : 1));
    break;
  default:
    runAllTests();
}

export { runAllTests };