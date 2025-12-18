#!/usr/bin/env ts-node

/**
 * Test script for token validation functionality
 * This tests the token validation logic in isolation
 */

// Mock the required dependencies
const mockAuthStateDebugger = {
  log: (level: string, event: string, data: any) => {
    console.log(`[${level.toUpperCase()}] ${event}:`, JSON.stringify(data, null, 2));
  }
};

const mockLogWithTimestamp = (message: string, data?: any) => {
  console.log(`[${new Date().toISOString()}] ${message}`, data || '');
};

// Token validation function (extracted from UnifiedAuthManager)
function validateToken(token: string): boolean {
  if (!token) {
    mockAuthStateDebugger.log('error', 'token_validation_failed', { 
      reason: 'missing_token',
      context: 'validateToken'
    });
    mockLogWithTimestamp('Token validation failed: missing token');
    return false;
  }

  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      mockAuthStateDebugger.log('error', 'token_validation_failed', { 
        reason: 'invalid_format',
        context: 'validateToken',
        parts: parts.length
      });
      mockLogWithTimestamp('Token validation failed: invalid format', { parts: parts.length });
      return false;
    }

    // Decode the payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check expiration
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      const isValid = payload.exp > now;
      
      if (!isValid) {
        const expiredBy = now - payload.exp;
        mockAuthStateDebugger.log('error', 'token_validation_failed', { 
          reason: 'expired',
          context: 'validateToken',
          exp: payload.exp,
          now,
          expiredBy
        });
        mockLogWithTimestamp('Token validation failed: token expired', {
          exp: payload.exp,
          now,
          expiredBy
        });
      } else {
        const expiresIn = payload.exp - now;
        mockAuthStateDebugger.log('info', 'token_validation_success', { 
          expiresIn,
          context: 'validateToken'
        });
      }
      
      return isValid;
    }
    
    // If no expiration, consider it valid but log warning
    mockAuthStateDebugger.log('warn', 'token_no_expiration', { 
      context: 'validateToken'
    });
    mockLogWithTimestamp('Token has no expiration field');
    return true;
  } catch (error) {
    mockAuthStateDebugger.log('error', 'token_validation_failed', { 
      reason: 'parse_error',
      context: 'validateToken',
      error: error instanceof Error ? error.message : String(error)
    });
    mockLogWithTimestamp('Token validation failed: parse error', { error });
    return false;
  }
}

// Helper to create test tokens
function createToken(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = 'fake-signature';
  return `${header}.${payloadEncoded}.${signature}`;
}

// Test cases
function runTests() {
  console.log('========================================');
  console.log('Token Validation Tests');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Valid token (not expired)
  console.log('Test 1: Valid Token (expires in 1 hour)');
  const now = Math.floor(Date.now() / 1000);
  const validToken = createToken({
    userId: 123,
    email: 'test@example.com',
    exp: now + 3600
  });
  const test1 = validateToken(validToken);
  console.log(`Result: ${test1 ? 'PASS' : 'FAIL'} (expected: true, got: ${test1})\n`);
  test1 ? passed++ : failed++;

  // Test 2: Expired token
  console.log('Test 2: Expired Token (expired 1 hour ago)');
  const expiredToken = createToken({
    userId: 123,
    email: 'test@example.com',
    exp: now - 3600
  });
  const test2 = !validateToken(expiredToken);
  console.log(`Result: ${test2 ? 'PASS' : 'FAIL'} (expected: false, got: ${!test2})\n`);
  test2 ? passed++ : failed++;

  // Test 3: Invalid format
  console.log('Test 3: Invalid Token Format');
  const test3 = !validateToken('invalid-token');
  console.log(`Result: ${test3 ? 'PASS' : 'FAIL'} (expected: false, got: ${!test3})\n`);
  test3 ? passed++ : failed++;

  // Test 4: Empty token
  console.log('Test 4: Empty Token');
  const test4 = !validateToken('');
  console.log(`Result: ${test4 ? 'PASS' : 'FAIL'} (expected: false, got: ${!test4})\n`);
  test4 ? passed++ : failed++;

  // Test 5: Token without expiration
  console.log('Test 5: Token Without Expiration');
  const noExpToken = createToken({
    userId: 123,
    email: 'test@example.com'
  });
  const test5 = validateToken(noExpToken);
  console.log(`Result: ${test5 ? 'PASS' : 'FAIL'} (expected: true, got: ${test5})\n`);
  test5 ? passed++ : failed++;

  // Test 6: Token expiring in 1 second
  console.log('Test 6: Token Expiring Soon (1 second)');
  const soonExpToken = createToken({
    userId: 123,
    email: 'test@example.com',
    exp: now + 1
  });
  const test6 = validateToken(soonExpToken);
  console.log(`Result: ${test6 ? 'PASS' : 'FAIL'} (expected: true, got: ${test6})\n`);
  test6 ? passed++ : failed++;

  // Test 7: Token that just expired
  console.log('Test 7: Token Just Expired (1 second ago)');
  const justExpiredToken = createToken({
    userId: 123,
    email: 'test@example.com',
    exp: now - 1
  });
  const test7 = !validateToken(justExpiredToken);
  console.log(`Result: ${test7 ? 'PASS' : 'FAIL'} (expected: false, got: ${!test7})\n`);
  test7 ? passed++ : failed++;

  // Summary
  console.log('========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('========================================');

  return failed === 0;
}

// Run tests
const success = runTests();
process.exit(success ? 0 : 1);
