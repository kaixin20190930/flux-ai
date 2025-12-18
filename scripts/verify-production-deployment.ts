#!/usr/bin/env tsx

/**
 * Production Deployment Verification Script
 * 
 * This script verifies that the production deployment is working correctly.
 * Run this AFTER deploying to production.
 * 
 * Usage: PRODUCTION_URL=https://yourdomain.com npx tsx scripts/verify-production-deployment.ts
 */

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

function addResult(name: string, passed: boolean, message: string, duration?: number) {
  results.push({ name, passed, message, duration });
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Test 1: Health Check
async function testHealthEndpoint(baseUrl: string) {
  console.log('\n🔍 Testing Health Endpoint...');
  const start = Date.now();
  
  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/health`);
    const duration = Date.now() - start;
    
    if (response.ok) {
      addResult(
        'Health Endpoint',
        true,
        `Health endpoint responding (${duration}ms)`,
        duration
      );
    } else {
      addResult(
        'Health Endpoint',
        false,
        `Health endpoint returned ${response.status}`,
        duration
      );
    }
  } catch (error) {
    const duration = Date.now() - start;
    addResult(
      'Health Endpoint',
      false,
      `Health endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration
    );
  }
}

// Test 2: NextAuth Providers
async function testAuthProviders(baseUrl: string) {
  console.log('\n🔍 Testing NextAuth Providers...');
  const start = Date.now();
  
  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/auth/providers`);
    const duration = Date.now() - start;
    
    if (response.ok) {
      const data = await response.json();
      const providers = Object.keys(data);
      
      if (providers.includes('google') && providers.includes('credentials')) {
        addResult(
          'Auth Providers',
          true,
          `Auth providers configured: ${providers.join(', ')} (${duration}ms)`,
          duration
        );
      } else {
        addResult(
          'Auth Providers',
          false,
          `Missing providers. Found: ${providers.join(', ')}`,
          duration
        );
      }
    } else {
      addResult(
        'Auth Providers',
        false,
        `Auth providers endpoint returned ${response.status}`,
        duration
      );
    }
  } catch (error) {
    const duration = Date.now() - start;
    addResult(
      'Auth Providers',
      false,
      `Auth providers check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration
    );
  }
}

// Test 3: HTTPS Configuration
async function testHTTPS(baseUrl: string) {
  console.log('\n🔍 Testing HTTPS Configuration...');
  
  if (baseUrl.startsWith('https://')) {
    addResult(
      'HTTPS',
      true,
      'Application is using HTTPS',
      0
    );
  } else if (baseUrl.includes('localhost')) {
    addResult(
      'HTTPS',
      true,
      'Localhost detected - HTTPS not required for local testing',
      0
    );
  } else {
    addResult(
      'HTTPS',
      false,
      'Application should use HTTPS in production',
      0
    );
  }
}

// Test 4: Registration Endpoint
async function testRegistrationEndpoint(baseUrl: string) {
  console.log('\n🔍 Testing Registration Endpoint...');
  const start = Date.now();
  
  try {
    // Test with invalid data (should return 400)
    const response = await fetchWithTimeout(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const duration = Date.now() - start;
    
    if (response.status === 400) {
      addResult(
        'Registration Endpoint',
        true,
        `Registration endpoint validates input correctly (${duration}ms)`,
        duration
      );
    } else {
      addResult(
        'Registration Endpoint',
        false,
        `Registration endpoint returned unexpected status: ${response.status}`,
        duration
      );
    }
  } catch (error) {
    const duration = Date.now() - start;
    addResult(
      'Registration Endpoint',
      false,
      `Registration endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration
    );
  }
}

// Test 5: Session Endpoint
async function testSessionEndpoint(baseUrl: string) {
  console.log('\n🔍 Testing Session Endpoint...');
  const start = Date.now();
  
  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/auth/session`);
    const duration = Date.now() - start;
    
    if (response.ok) {
      const data = await response.json();
      addResult(
        'Session Endpoint',
        true,
        `Session endpoint responding (${duration}ms)`,
        duration
      );
    } else {
      addResult(
        'Session Endpoint',
        false,
        `Session endpoint returned ${response.status}`,
        duration
      );
    }
  } catch (error) {
    const duration = Date.now() - start;
    addResult(
      'Session Endpoint',
      false,
      `Session endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration
    );
  }
}

// Test 6: Protected Route (should return 401 when not authenticated)
async function testProtectedRoute(baseUrl: string) {
  console.log('\n🔍 Testing Protected Route...');
  const start = Date.now();
  
  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test' }),
    });
    const duration = Date.now() - start;
    
    if (response.status === 401) {
      addResult(
        'Protected Route',
        true,
        `Protected route correctly requires authentication (${duration}ms)`,
        duration
      );
    } else {
      addResult(
        'Protected Route',
        false,
        `Protected route returned unexpected status: ${response.status}`,
        duration
      );
    }
  } catch (error) {
    const duration = Date.now() - start;
    addResult(
      'Protected Route',
      false,
      `Protected route test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration
    );
  }
}

// Test 7: Response Time
async function testResponseTime(baseUrl: string) {
  console.log('\n🔍 Testing Response Time...');
  
  const times: number[] = [];
  const iterations = 3;
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await fetchWithTimeout(`${baseUrl}/api/health`);
      times.push(Date.now() - start);
    } catch (error) {
      // Ignore errors for this test
    }
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    
    if (avgTime < 1000) {
      addResult(
        'Response Time',
        true,
        `Average response time: ${avgTime.toFixed(0)}ms (max: ${maxTime}ms)`,
        avgTime
      );
    } else {
      addResult(
        'Response Time',
        false,
        `Response time too slow: ${avgTime.toFixed(0)}ms average`,
        avgTime
      );
    }
  } else {
    addResult(
      'Response Time',
      false,
      'Could not measure response time',
      0
    );
  }
}

// Test 8: Security Headers
async function testSecurityHeaders(baseUrl: string) {
  console.log('\n🔍 Testing Security Headers...');
  const start = Date.now();
  
  try {
    const response = await fetchWithTimeout(baseUrl);
    const duration = Date.now() - start;
    
    const headers = response.headers;
    const securityHeaders = {
      'x-frame-options': headers.get('x-frame-options'),
      'x-content-type-options': headers.get('x-content-type-options'),
      'strict-transport-security': headers.get('strict-transport-security'),
    };
    
    const missingHeaders: string[] = [];
    if (!securityHeaders['x-frame-options']) missingHeaders.push('X-Frame-Options');
    if (!securityHeaders['x-content-type-options']) missingHeaders.push('X-Content-Type-Options');
    
    if (baseUrl.startsWith('https://') && !securityHeaders['strict-transport-security']) {
      missingHeaders.push('Strict-Transport-Security');
    }
    
    if (missingHeaders.length === 0) {
      addResult(
        'Security Headers',
        true,
        `Security headers configured (${duration}ms)`,
        duration
      );
    } else {
      addResult(
        'Security Headers',
        false,
        `Missing security headers: ${missingHeaders.join(', ')}`,
        duration
      );
    }
  } catch (error) {
    const duration = Date.now() - start;
    addResult(
      'Security Headers',
      false,
      `Security headers check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration
    );
  }
}

// Print Results
function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 PRODUCTION DEPLOYMENT VERIFICATION REPORT');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);
  
  console.log(`\n✅ Passed: ${passed}/${total} (${percentage}%)`);
  console.log('');
  
  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    const durationStr = result.duration !== undefined ? ` (${result.duration}ms)` : '';
    console.log(`${icon} ${result.name}${durationStr}`);
    console.log(`   ${result.message}`);
    console.log('');
  }
  
  console.log('='.repeat(80));
  
  if (passed === total) {
    console.log('✅ ALL TESTS PASSED - DEPLOYMENT SUCCESSFUL');
    console.log('');
    console.log('Your application is ready for production use!');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
    console.log('');
    console.log('Please review the failed tests and fix any issues.');
    console.log('Common issues:');
    console.log('- Environment variables not set correctly');
    console.log('- Database migrations not run');
    console.log('- Google OAuth not configured for production domain');
    console.log('- Security headers not configured');
  }
  
  console.log('='.repeat(80));
  
  // Exit with error code if tests failed
  if (passed < total) {
    process.exit(1);
  }
}

// Main execution
async function main() {
  const productionUrl = process.env.PRODUCTION_URL || process.env.NEXTAUTH_URL;
  
  if (!productionUrl) {
    console.error('❌ Error: PRODUCTION_URL environment variable not set');
    console.error('');
    console.error('Usage: PRODUCTION_URL=https://yourdomain.com npx tsx scripts/verify-production-deployment.ts');
    process.exit(1);
  }
  
  console.log('🚀 Production Deployment Verification');
  console.log('=====================================');
  console.log(`Testing: ${productionUrl}`);
  
  await testHealthEndpoint(productionUrl);
  await testHTTPS(productionUrl);
  await testAuthProviders(productionUrl);
  await testSessionEndpoint(productionUrl);
  await testRegistrationEndpoint(productionUrl);
  await testProtectedRoute(productionUrl);
  await testResponseTime(productionUrl);
  await testSecurityHeaders(productionUrl);
  
  printResults();
}

main().catch(console.error);
