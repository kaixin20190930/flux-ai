#!/usr/bin/env node

/**
 * 生产环境诊断脚本
 * 
 * 此脚本帮助诊断为什么生产环境中环境变量未正确注入
 */

console.log('🔍 生产环境诊断工具\n');
console.log('=' .repeat(60));

// 检查 1: 本地环境变量
console.log('\n📋 步骤 1: 检查本地环境变量配置');
console.log('-'.repeat(60));

const fs = require('fs');
const path = require('path');

const envFiles = ['.env.local', '.env.production', '.env'];
let foundWorkerUrl = false;

envFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ 找到文件: ${file}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const workerUrlMatch = content.match(/NEXT_PUBLIC_WORKER_URL=(.+)/);
    if (workerUrlMatch) {
      console.log(`   NEXT_PUBLIC_WORKER_URL=${workerUrlMatch[1]}`);
      foundWorkerUrl = true;
    }
  } else {
    console.log(`❌ 未找到文件: ${file}`);
  }
});

if (!foundWorkerUrl) {
  console.log('\n⚠️  警告: 本地未找到 NEXT_PUBLIC_WORKER_URL 配置');
  console.log('   这是正常的，因为生产环境变量应该在部署平台配置');
}

// 检查 2: 代码中的使用
console.log('\n📋 步骤 2: 检查代码中如何使用环境变量');
console.log('-'.repeat(60));

const hookPath = path.join(process.cwd(), 'hooks', 'useImageGeneration.tsx');
if (fs.existsSync(hookPath)) {
  const hookContent = fs.readFileSync(hookPath, 'utf-8');
  
  // 查找 WORKER_URL 定义
  const workerUrlDefMatch = hookContent.match(/const WORKER_URL = ([^;]+);/s);
  if (workerUrlDefMatch) {
    console.log('✅ 找到 WORKER_URL 定义:');
    console.log(workerUrlDefMatch[0].split('\n').map(line => '   ' + line).join('\n'));
  }
  
  // 查找所有使用 WORKER_URL 的地方
  const usages = hookContent.match(/\$\{WORKER_URL\}[^\s]*/g);
  if (usages) {
    console.log('\n✅ WORKER_URL 使用位置:');
    usages.forEach(usage => {
      console.log(`   ${usage}`);
    });
  }
} else {
  console.log('❌ 未找到 hooks/useImageGeneration.tsx');
}

// 检查 3: Next.js 配置
console.log('\n📋 步骤 3: 检查 Next.js 配置');
console.log('-'.repeat(60));

const nextConfigPath = path.join(process.cwd(), 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf-8');
  
  // 检查是否有 env 配置
  if (nextConfig.includes('env:')) {
    console.log('✅ next.config.js 中有 env 配置');
    const envMatch = nextConfig.match(/env:\s*\{([^}]+)\}/s);
    if (envMatch) {
      console.log(envMatch[0].split('\n').map(line => '   ' + line).join('\n'));
    }
  } else {
    console.log('ℹ️  next.config.js 中没有 env 配置（这是正常的）');
    console.log('   NEXT_PUBLIC_* 变量会自动注入，无需在 next.config.js 中配置');
  }
} else {
  console.log('❌ 未找到 next.config.js');
}

// 检查 4: 构建输出
console.log('\n📋 步骤 4: 检查构建配置');
console.log('-'.repeat(60));

const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  console.log('✅ 构建脚本:');
  console.log(`   build: ${packageJson.scripts.build || '未定义'}`);
  console.log(`   start: ${packageJson.scripts.start || '未定义'}`);
}

// 生成诊断报告
console.log('\n' + '='.repeat(60));
console.log('📊 诊断报告');
console.log('='.repeat(60));

console.log('\n✅ 本地代码检查完成');
console.log('\n接下来需要检查生产环境：');
console.log('\n1️⃣  在生产环境浏览器控制台中查看：');
console.log('   打开 https://flux-ai-img.com');
console.log('   打开浏览器开发者工具（F12）');
console.log('   查看 Console 标签，找到：');
console.log('   🔧 Worker URL Configuration: { ... }');
console.log('\n2️⃣  在 Network 标签中查看：');
console.log('   点击"生成图片"按钮');
console.log('   查看失败的请求');
console.log('   记录完整的 Request URL');
console.log('\n3️⃣  在部署平台检查：');
console.log('   Cloudflare Pages Dashboard');
console.log('   Settings -> Environment variables');
console.log('   确认 NEXT_PUBLIC_WORKER_URL 已配置在 Production 环境');
console.log('\n4️⃣  检查部署时间：');
console.log('   Deployments 页面');
console.log('   确认最新部署时间晚于环境变量配置时间');

console.log('\n' + '='.repeat(60));
console.log('📝 请提供以下信息：');
console.log('='.repeat(60));
console.log('\n1. 浏览器控制台的 "🔧 Worker URL Configuration" 完整输出');
console.log('2. Network 标签中失败请求的完整 URL');
console.log('3. 部署平台截图（环境变量配置页面）');
console.log('4. 最新部署的时间戳');
console.log('\n有了这些信息，我可以精确定位问题所在。\n');
