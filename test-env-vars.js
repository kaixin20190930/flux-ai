#!/usr/bin/env node

/**
 * 测试环境变量是否正确加载
 */

console.log('🔍 检查环境变量配置...\n');

// 读取 .env.local 文件
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local 文件不存在');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

console.log('📋 .env.local 中的配置:');
console.log('-----------------------------------');

const workerUrlLine = lines.find(line => line.startsWith('NEXT_PUBLIC_WORKER_URL='));
if (workerUrlLine) {
    const value = workerUrlLine.split('=')[1];
    console.log('✅ NEXT_PUBLIC_WORKER_URL:', value);
} else {
    console.log('❌ NEXT_PUBLIC_WORKER_URL 未配置');
}

console.log('-----------------------------------\n');

// 检查 Next.js 是否能读取
console.log('🔧 Next.js 环境变量读取测试:');
console.log('-----------------------------------');
console.log('process.env.NEXT_PUBLIC_WORKER_URL:', process.env.NEXT_PUBLIC_WORKER_URL || '❌ 未定义');
console.log('process.env.NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('-----------------------------------\n');

if (!process.env.NEXT_PUBLIC_WORKER_URL) {
    console.log('⚠️  警告: Next.js 无法读取 NEXT_PUBLIC_WORKER_URL');
    console.log('');
    console.log('📝 解决方案:');
    console.log('1. 确保 .env.local 文件存在');
    console.log('2. 重启开发服务器: npm run dev');
    console.log('3. 或运行: ./scripts/restart-dev-with-env.sh');
    console.log('');
} else {
    console.log('✅ 环境变量配置正确！');
}
