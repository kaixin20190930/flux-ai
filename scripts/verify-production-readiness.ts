#!/usr/bin/env tsx

/**
 * Production Readiness Verification Script
 * 
 * This script verifies that all requirements for production deployment are met.
 * Run this before deploying to production.
 * 
 * Usage: npx tsx scripts/verify-production-readiness.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  critical: boolean;
}

const results: CheckResult[] = [];

function addResult(name: string, passed: boolean, message: string, critical: boolean = true) {
  results.push({ name, passed, message, critical });
}

// Check 1: Environment Variables
function checkEnvironmentVariables() {
  console.log('\n🔍 Checking Environment Variables...');
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];
  
  const missingVars: string[] = [];
  const weakVars: string[] = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    } else {
      // Check for placeholder values
      const value = process.env[varName];
      if (
        value.includes('your-') ||
        value.includes('generate-') ||
        value.includes('localhost') ||
        value.includes('example')
      ) {
        weakVars.push(varName);
      }
    }
  }
  
  if (missingVars.length > 0) {
    addResult(
      'Environment Variables',
      false,
      `Missing required variables: ${missingVars.join(', ')}`,
      true
    );
  } else if (weakVars.length > 0) {
    addResult(
      'Environment Variables',
      false,
      `Placeholder values detected in: ${weakVars.join(', ')}. Replace with production values.`,
      true
    );
  } else {
    addResult(
      'Environment Variables',
      true,
      'All required environment variables are set',
      true
    );
  }
  
  // Check NEXTAUTH_SECRET strength
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && secret.length < 32) {
    addResult(
      'NEXTAUTH_SECRET Strength',
      false,
      `NEXTAUTH_SECRET is too short (${secret.length} chars). Should be at least 32 characters.`,
      true
    );
  } else if (secret) {
    addResult(
      'NEXTAUTH_SECRET Strength',
      true,
      'NEXTAUTH_SECRET meets minimum length requirement',
      true
    );
  }
  
  // Check DATABASE_URL for SSL
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.includes('sslmode=require') && !dbUrl.includes('localhost')) {
    addResult(
      'Database SSL',
      false,
      'DATABASE_URL should include sslmode=require for production',
      true
    );
  } else if (dbUrl && dbUrl.includes('sslmode=require')) {
    addResult(
      'Database SSL',
      true,
      'Database connection configured with SSL',
      true
    );
  }
  
  // Check NEXTAUTH_URL for HTTPS
  const authUrl = process.env.NEXTAUTH_URL;
  if (authUrl && !authUrl.startsWith('https://') && !authUrl.includes('localhost')) {
    addResult(
      'HTTPS Configuration',
      false,
      'NEXTAUTH_URL should use HTTPS in production',
      true
    );
  } else if (authUrl && authUrl.startsWith('https://')) {
    addResult(
      'HTTPS Configuration',
      true,
      'NEXTAUTH_URL configured with HTTPS',
      true
    );
  }
}

// Check 2: Prisma Schema and Migrations
function checkPrismaSetup() {
  console.log('\n🔍 Checking Prisma Setup...');
  
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
  
  if (!fs.existsSync(schemaPath)) {
    addResult(
      'Prisma Schema',
      false,
      'prisma/schema.prisma not found',
      true
    );
  } else {
    addResult(
      'Prisma Schema',
      true,
      'Prisma schema file exists',
      true
    );
  }
  
  if (!fs.existsSync(migrationsPath)) {
    addResult(
      'Prisma Migrations',
      false,
      'No migrations directory found. Run: npx prisma migrate dev',
      true
    );
  } else {
    const migrations = fs.readdirSync(migrationsPath).filter(f => !f.startsWith('.'));
    if (migrations.length === 0) {
      addResult(
        'Prisma Migrations',
        false,
        'No migrations found. Run: npx prisma migrate dev',
        true
      );
    } else {
      addResult(
        'Prisma Migrations',
        true,
        `Found ${migrations.length} migration(s)`,
        true
      );
    }
  }
  
  // Check if Prisma Client is generated
  const prismaClientPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
  if (!fs.existsSync(prismaClientPath)) {
    addResult(
      'Prisma Client',
      false,
      'Prisma Client not generated. Run: npx prisma generate',
      true
    );
  } else {
    addResult(
      'Prisma Client',
      true,
      'Prisma Client is generated',
      true
    );
  }
}

// Check 3: NextAuth Configuration
function checkNextAuthConfig() {
  console.log('\n🔍 Checking NextAuth Configuration...');
  
  const authConfigPath = path.join(process.cwd(), 'lib', 'auth.ts');
  const authRoutePath = path.join(process.cwd(), 'app', 'api', 'auth', '[...nextauth]', 'route.ts');
  
  if (!fs.existsSync(authConfigPath)) {
    addResult(
      'NextAuth Config',
      false,
      'lib/auth.ts not found',
      true
    );
  } else {
    const content = fs.readFileSync(authConfigPath, 'utf-8');
    
    // Check for required providers
    if (!content.includes('GoogleProvider')) {
      addResult(
        'Google OAuth Provider',
        false,
        'GoogleProvider not configured in lib/auth.ts',
        true
      );
    } else {
      addResult(
        'Google OAuth Provider',
        true,
        'Google OAuth provider configured',
        true
      );
    }
    
    if (!content.includes('CredentialsProvider')) {
      addResult(
        'Credentials Provider',
        false,
        'CredentialsProvider not configured in lib/auth.ts',
        true
      );
    } else {
      addResult(
        'Credentials Provider',
        true,
        'Credentials provider configured',
        true
      );
    }
    
    // Check for Prisma adapter
    if (!content.includes('PrismaAdapter')) {
      addResult(
        'Prisma Adapter',
        false,
        'PrismaAdapter not configured in lib/auth.ts',
        true
      );
    } else {
      addResult(
        'Prisma Adapter',
        true,
        'Prisma adapter configured',
        true
      );
    }
  }
  
  if (!fs.existsSync(authRoutePath)) {
    addResult(
      'NextAuth API Route',
      false,
      'app/api/auth/[...nextauth]/route.ts not found',
      true
    );
  } else {
    addResult(
      'NextAuth API Route',
      true,
      'NextAuth API route exists',
      true
    );
  }
}

// Check 4: Security Configuration
function checkSecurityConfig() {
  console.log('\n🔍 Checking Security Configuration...');
  
  // Check for bcrypt
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (!deps['bcryptjs'] && !deps['bcrypt']) {
      addResult(
        'Password Hashing',
        false,
        'bcryptjs not installed. Run: npm install bcryptjs',
        true
      );
    } else {
      addResult(
        'Password Hashing',
        true,
        'Password hashing library installed',
        true
      );
    }
  }
  
  // Check registration route for password hashing
  const registerPath = path.join(process.cwd(), 'app', 'api', 'auth', 'register', 'route.ts');
  if (fs.existsSync(registerPath)) {
    const content = fs.readFileSync(registerPath, 'utf-8');
    
    if (!content.includes('bcrypt.hash')) {
      addResult(
        'Password Hashing Implementation',
        false,
        'Registration route does not hash passwords',
        true
      );
    } else {
      addResult(
        'Password Hashing Implementation',
        true,
        'Passwords are hashed in registration',
        true
      );
    }
  }
}

// Check 5: Build Configuration
function checkBuildConfig() {
  console.log('\n🔍 Checking Build Configuration...');
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (!fs.existsSync(nextConfigPath)) {
    addResult(
      'Next.js Config',
      false,
      'next.config.js not found',
      false
    );
  } else {
    addResult(
      'Next.js Config',
      true,
      'Next.js configuration exists',
      false
    );
  }
  
  // Check if build succeeds (we won't actually build, just check for obvious issues)
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    if (!packageJson.scripts || !packageJson.scripts.build) {
      addResult(
        'Build Script',
        false,
        'No build script found in package.json',
        true
      );
    } else {
      addResult(
        'Build Script',
        true,
        'Build script configured',
        false
      );
    }
  }
}

// Check 6: Required Files
function checkRequiredFiles() {
  console.log('\n🔍 Checking Required Files...');
  
  const requiredFiles = [
    'lib/prisma.ts',
    'lib/auth.ts',
    'lib/auth-utils.ts',
    'lib/points.ts',
    'app/api/auth/register/route.ts',
    'components/providers/SessionProvider.tsx',
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      addResult(
        `Required File: ${file}`,
        false,
        `${file} not found`,
        true
      );
    } else {
      addResult(
        `Required File: ${file}`,
        true,
        `${file} exists`,
        false
      );
    }
  }
}

// Check 7: Dependencies
function checkDependencies() {
  console.log('\n🔍 Checking Dependencies...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    addResult(
      'Dependencies',
      false,
      'package.json not found',
      true
    );
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    'next-auth',
    '@prisma/client',
    'prisma',
    '@auth/prisma-adapter',
    'bcryptjs',
  ];
  
  const missingDeps: string[] = [];
  
  for (const dep of requiredDeps) {
    if (!deps[dep]) {
      missingDeps.push(dep);
    }
  }
  
  if (missingDeps.length > 0) {
    addResult(
      'Required Dependencies',
      false,
      `Missing dependencies: ${missingDeps.join(', ')}`,
      true
    );
  } else {
    addResult(
      'Required Dependencies',
      true,
      'All required dependencies installed',
      true
    );
  }
}

// Print Results
function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 PRODUCTION READINESS REPORT');
  console.log('='.repeat(80));
  
  const criticalResults = results.filter(r => r.critical);
  const nonCriticalResults = results.filter(r => !r.critical);
  
  const criticalPassed = criticalResults.filter(r => r.passed).length;
  const criticalTotal = criticalResults.length;
  const nonCriticalPassed = nonCriticalResults.filter(r => r.passed).length;
  const nonCriticalTotal = nonCriticalResults.length;
  
  console.log('\n🔴 CRITICAL CHECKS:');
  console.log(`   Passed: ${criticalPassed}/${criticalTotal}`);
  console.log('');
  
  for (const result of criticalResults) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    console.log('');
  }
  
  console.log('\n🟡 NON-CRITICAL CHECKS:');
  console.log(`   Passed: ${nonCriticalPassed}/${nonCriticalTotal}`);
  console.log('');
  
  for (const result of nonCriticalResults) {
    const icon = result.passed ? '✅' : '⚠️';
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    console.log('');
  }
  
  console.log('='.repeat(80));
  
  const allCriticalPassed = criticalResults.every(r => r.passed);
  
  if (allCriticalPassed) {
    console.log('✅ READY FOR PRODUCTION DEPLOYMENT');
    console.log('');
    console.log('Next steps:');
    console.log('1. Review the deployment guide: .kiro/specs/modern-auth-system/DEPLOYMENT_GUIDE.md');
    console.log('2. Set up production environment variables');
    console.log('3. Run database migrations: npx prisma migrate deploy');
    console.log('4. Deploy to your hosting platform');
    console.log('5. Run post-deployment verification: npx tsx scripts/verify-production-deployment.ts');
  } else {
    console.log('❌ NOT READY FOR PRODUCTION');
    console.log('');
    console.log('Please fix all critical issues before deploying.');
    process.exit(1);
  }
  
  console.log('='.repeat(80));
}

// Main execution
async function main() {
  console.log('🚀 Production Readiness Verification');
  console.log('====================================');
  
  checkEnvironmentVariables();
  checkPrismaSetup();
  checkNextAuthConfig();
  checkSecurityConfig();
  checkBuildConfig();
  checkRequiredFiles();
  checkDependencies();
  
  printResults();
}

main().catch(console.error);
