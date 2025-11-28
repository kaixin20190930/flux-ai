#!/usr/bin/env ts-node

/**
 * Authentication Diagnosis Script
 * 
 * This script helps diagnose authentication issues by testing:
 * 1. Database connection
 * 2. User repository functionality
 * 3. Authentication service
 * 4. Password hashing
 */

import { userRepository } from '../utils/userRepository';
import { AuthenticationService } from '../utils/authenticationService';
import { EdgeAuth } from '../utils/edgeUtils';

async function diagnoseAuth() {
  console.log('🔍 Starting Authentication Diagnosis...\n');

  // Test 1: Check User Repository Connection
  console.log('📊 Test 1: User Repository Connection');
  console.log('=====================================');
  const connectionInfo = userRepository.getConnectionInfo();
  console.log('Connection Info:', JSON.stringify(connectionInfo, null, 2));
  
  if (!connectionInfo.hasDatabase) {
    console.log('⚠️  WARNING: No database connection! Using fallback mode.');
  } else {
    console.log('✅ Database connection available');
  }
  console.log('');

  // Test 2: Test Database Connection
  console.log('📊 Test 2: Database Connection Test');
  console.log('====================================');
  try {
    const isConnected = await userRepository.testConnection();
    if (isConnected) {
      console.log('✅ Database connection test passed');
    } else {
      console.log('❌ Database connection test failed');
    }
  } catch (error) {
    console.log('❌ Database connection test error:', error);
  }
  console.log('');

  // Test 3: Try to find a test user
  console.log('📊 Test 3: Find Test User');
  console.log('==========================');
  try {
    const testUser = await userRepository.findByEmail('test@example.com');
    if (testUser) {
      console.log('✅ Found test user:', {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        points: testUser.points,
        hasPassword: !!testUser.password
      });
    } else {
      console.log('⚠️  Test user not found');
    }
  } catch (error) {
    console.log('❌ Error finding test user:', error);
  }
  console.log('');

  // Test 4: Test Password Hashing
  console.log('📊 Test 4: Password Hashing');
  console.log('============================');
  try {
    const testPassword = 'password123';
    const hashedPassword = await EdgeAuth.hashPassword(testPassword);
    console.log('✅ Password hashed successfully');
    console.log('Hash length:', hashedPassword.length);
    
    const isValid = await EdgeAuth.verifyPassword(testPassword, hashedPassword);
    if (isValid) {
      console.log('✅ Password verification successful');
    } else {
      console.log('❌ Password verification failed');
    }
  } catch (error) {
    console.log('❌ Password hashing error:', error);
  }
  console.log('');

  // Test 5: Test Credential Validation
  console.log('📊 Test 5: Credential Validation');
  console.log('=================================');
  try {
    const isValid = await userRepository.validateCredentials('test@example.com', 'password');
    if (isValid) {
      console.log('✅ Credential validation successful');
    } else {
      console.log('❌ Credential validation failed');
    }
  } catch (error) {
    console.log('❌ Credential validation error:', error);
  }
  console.log('');

  // Test 6: Test Authentication Service
  console.log('📊 Test 6: Authentication Service');
  console.log('==================================');
  try {
    const authService = new AuthenticationService(userRepository, process.env.JWT_SECRET);
    const serviceInfo = authService.getServiceInfo();
    console.log('Service Info:', JSON.stringify(serviceInfo, null, 2));
    
    if (!serviceInfo.hasJwtSecret) {
      console.log('❌ JWT_SECRET not configured!');
    } else {
      console.log('✅ JWT_SECRET configured');
    }
  } catch (error) {
    console.log('❌ Authentication service error:', error);
  }
  console.log('');

  // Test 7: Try Login
  console.log('📊 Test 7: Test Login');
  console.log('=====================');
  try {
    const authService = new AuthenticationService(userRepository, process.env.JWT_SECRET);
    const result = await authService.loginWithPassword('test@example.com', 'password');
    
    if (result.success) {
      console.log('✅ Login successful!');
      console.log('User:', {
        id: result.user?.id,
        email: result.user?.email,
        name: result.user?.name
      });
      console.log('Token generated:', !!result.token);
    } else {
      console.log('❌ Login failed');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.log('❌ Login test error:', error);
  }
  console.log('');

  console.log('🏁 Diagnosis Complete!\n');
}

// Run diagnosis
diagnoseAuth().catch(console.error);
