#!/usr/bin/env node

/**
 * Cloudflare Worker 配置测试脚本
 * Cloudflare Worker Configuration Test Script
 */

// Load environment variables
import * as fs from 'fs';
import * as path from 'path';

function loadEnvFiles() {
    const envFiles = ['.env.local', '.env.development', '.env'];

    for (const envFile of envFiles) {
        const envPath = path.resolve(envFile);
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const lines = content.split('\n');

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine && !trimmedLine.startsWith('#')) {
                    const [key, ...valueParts] = trimmedLine.split('=');
                    if (key && valueParts.length > 0) {
                        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                        if (!process.env[key.trim()]) {
                            process.env[key.trim()] = value;
                        }
                    }
                }
            }
        }
    }
}

loadEnvFiles();

// Mock Cloudflare Worker environment
const mockEnv: any = {
    JWT_SECRET: process.env.JWT_SECRET || 'test-secret-key-for-testing-purposes-only',
    ENVIRONMENT: 'development' as const,
    'DB-DEV': {
        // Mock D1 database interface
        prepare: () => ({
            bind: () => ({
                first: () => Promise.resolve(null),
                all: () => Promise.resolve({ results: [] }),
                run: () => Promise.resolve({ success: true, meta: { last_row_id: 1 } })
            })
        }),
        exec: () => Promise.resolve({ success: true }),
        dump: () => Promise.resolve(new ArrayBuffer(0)),
        batch: () => Promise.resolve([])
    },
    LOG_LEVEL: 'debug' as const
};

async function testWorkerConfig() {
    console.log('🧪 Testing Cloudflare Worker Configuration...\n');

    try {
        // Test WorkerConfigManager
        const { WorkerConfigManager } = await import('../worker/utils/workerConfig');
        const configManager = new WorkerConfigManager(mockEnv);

        console.log('✅ WorkerConfigManager initialized successfully');

        // Test configuration
        const config = configManager.getConfig();
        console.log('📋 Configuration:', {
            environment: config.environment,
            jwtSecretLength: config.jwtSecret.length,
            databaseBinding: config.database.binding,
            allowedOrigins: config.cors.allowedOrigins.length,
            loggingEnabled: config.logging.enabled
        });

        // Test CORS headers
        const corsHeaders = configManager.getCorsHeaders('http://localhost:3000');
        console.log('🌐 CORS Headers:', corsHeaders);

        // Test logger
        const logger = configManager.getLogger();
        console.log('📝 Testing logger...');
        logger.info('Test log message', { test: true });
        logger.warn('Test warning message');

        // Test WorkerAuthService
        console.log('\n🔐 Testing WorkerAuthService...');
        const { WorkerAuthService } = await import('../worker/services/authService');
        const authService = new WorkerAuthService(mockEnv);

        console.log('✅ WorkerAuthService initialized successfully');

        // Test WorkerErrorHandler
        console.log('\n🚨 Testing WorkerErrorHandler...');
        const { WorkerErrorHandler } = await import('../worker/utils/workerErrorHandler');
        const errorHandler = new WorkerErrorHandler(mockEnv);

        const testError = new Error('Test error');
        const workerError = errorHandler.handleError(testError, {
            operation: 'test-operation',
            requestUrl: 'http://localhost:3000/test'
        });

        console.log('📋 Error handling result:', {
            code: workerError.code,
            message: workerError.message,
            hasDetails: !!workerError.details
        });

        console.log('\n✅ All worker configuration tests passed!');

    } catch (error) {
        console.error('❌ Worker configuration test failed:', error);
        process.exit(1);
    }
}

async function testEnvironmentValidation() {
    console.log('\n🔍 Testing Environment Validation...\n');

    try {
        const { envConfig } = await import('../utils/envConfig');

        const validation = envConfig.validate();
        console.log('📋 Validation Result:', {
            isValid: validation.isValid,
            errorCount: validation.errors.length,
            warningCount: validation.warnings.length,
            suggestionCount: validation.suggestions.length
        });

        if (validation.errors.length > 0) {
            console.log('\n🚨 Errors:');
            validation.errors.forEach(error => {
                console.log(`  - ${error.key}: ${error.message}`);
            });
        }

        if (validation.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            validation.warnings.forEach(warning => {
                console.log(`  - ${warning.key}: ${warning.message}`);
            });
        }

        console.log('\n✅ Environment validation test completed!');

    } catch (error) {
        console.error('❌ Environment validation test failed:', error);
        process.exit(1);
    }
}

async function main() {
    console.log('🚀 Starting Worker Configuration Tests\n');

    await testWorkerConfig();
    await testEnvironmentValidation();

    console.log('\n🎉 All tests completed successfully!');
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}