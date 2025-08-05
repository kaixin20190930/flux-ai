#!/usr/bin/env node

/**
 * 推送所有 Cloudflare 修复到 GitHub 并重新部署
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 推送 Cloudflare 修复到 GitHub...\n');

try {
  // 1. 添加所有重要的修复文件
  console.log('📦 添加修复文件...');
  
  const filesToAdd = [
    'utils/edgeUtils.ts',
    'next.config.js',
    '.env.example',
    'app/api/*/route.ts',  // 所有 API 路由
    'utils/*.ts',          // 所有工具文件
    'components/**/*.tsx', // 所有组件
    'app/**/*.tsx',        // 所有页面
    'types/*.ts',          // 类型定义
    'config/*.ts',         // 配置文件
    'hooks/*.ts',          // 自定义 hooks
  ];

  // 添加所有修改过的文件
  execSync('git add .', { stdio: 'inherit' });
  
  // 2. 提交修复
  console.log('\n💾 提交修复...');
  const commitMessage = 'fix: Add Edge Runtime compatibility and missing edgeUtils.ts for Cloudflare deployment';
  
  try {
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  } catch (error) {
    console.log('ℹ️  没有新的更改需要提交，或者已经提交过了');
  }
  
  // 3. 推送到 GitHub
  console.log('\n🌐 推送到 GitHub...');
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log('\n✅ 成功推送到 GitHub!');
  
  // 4. 显示下一步操作
  console.log('\n📋 下一步操作：');
  console.log('1. 访问你的 Cloudflare Pages 仪表板');
  console.log('2. 触发重新部署，或等待自动部署');
  console.log('3. 查看部署日志，看是否还有错误');
  
  console.log('\n⚠️  预期结果：');
  console.log('- edgeUtils.ts 错误应该消失');
  console.log('- 但可能仍有其他 Edge Runtime 兼容性问题');
  console.log('- 如果仍有问题，建议考虑部署到 Vercel');
  
} catch (error) {
  console.error('❌ 推送过程中出现错误：', error.message);
  console.log('\n🔧 可能的解决方案：');
  console.log('1. 检查 Git 配置和权限');
  console.log('2. 手动执行：git add . && git commit -m "fix cloudflare" && git push');
  console.log('3. 或者直接考虑部署到 Vercel');
}