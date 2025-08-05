#!/usr/bin/env node

/**
 * 强制所有 API 路由使用 Edge Runtime
 * 这是 Cloudflare Pages 的要求
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 强制所有 API 路由使用 Edge Runtime...\n');

// 获取所有 API 路由文件
function getAllApiRoutes() {
  try {
    const result = execSync('find app/api -name "route.ts" -type f', { encoding: 'utf8' });
    return result.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    console.error('获取 API 路由失败：', error.message);
    return [];
  }
}

function forceEdgeRuntime(filePath) {
  console.log(`📝 处理 ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log('   文件不存在，跳过');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 检查是否已经有 Edge Runtime 配置
  if (content.includes("export const runtime = 'edge'")) {
    console.log('   ✅ 已配置为 Edge Runtime');
    return;
  }
  
  // 移除 Node.js Runtime 配置
  if (content.includes("export const runtime = 'nodejs'")) {
    content = content.replace(/export const runtime = ['"]nodejs['"];?\n?/g, '');
    console.log('   🔄 移除 Node.js Runtime 配置');
  }
  
  // 查找合适的插入位置
  const lines = content.split('\n');
  let insertIndex = -1;
  
  // 在导入语句之后，第一个 export function 之前插入
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('export async function') || 
        line.startsWith('export function') ||
        line.startsWith('export default')) {
      insertIndex = i;
      break;
    }
  }
  
  if (insertIndex === -1) {
    // 如果找不到函数，在文件末尾插入
    insertIndex = lines.length;
  }
  
  // 插入 Edge Runtime 配置
  const edgeConfig = [
    '',
    '// 强制使用 Edge Runtime (Cloudflare Pages 要求)',
    'export const runtime = \'edge\';',
    'export const dynamic = \'force-dynamic\';',
    ''
  ];
  
  lines.splice(insertIndex, 0, ...edgeConfig);
  
  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent);
  
  console.log('   ✅ 已强制配置为 Edge Runtime');
}

// 特殊处理：替换不兼容的导入
function replaceIncompatibleImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // 替换 bcryptjs
  if (content.includes('import bcrypt from \'bcryptjs\'') || content.includes('import * as bcrypt from \'bcryptjs\'')) {
    content = content.replace(/import.*bcrypt.*from ['"]bcryptjs['"];?\n?/g, '');
    content = content.replace(/import { NextRequest, NextResponse } from 'next\/server';/, 
      'import { NextRequest, NextResponse } from \'next/server\';\nimport { EdgeAuth } from \'@/utils/edgeUtils\';');
    
    // 替换函数调用
    content = content.replace(/bcrypt\.hash\(/g, 'EdgeAuth.hashPassword(');
    content = content.replace(/bcrypt\.compare\(/g, 'EdgeAuth.verifyPassword(');
    content = content.replace(/await bcrypt\.hash\(/g, 'await EdgeAuth.hashPassword(');
    content = content.replace(/await bcrypt\.compare\(/g, 'await EdgeAuth.verifyPassword(');
    
    changed = true;
    console.log('   🔄 替换 bcryptjs 为 EdgeAuth');
  }
  
  // 替换 jsonwebtoken
  if (content.includes('jsonwebtoken')) {
    content = content.replace(/import.*jwt.*from ['"]jsonwebtoken['"];?\n?/g, '');
    if (!content.includes('import { EdgeAuth }')) {
      content = content.replace(/import { NextRequest, NextResponse } from 'next\/server';/, 
        'import { NextRequest, NextResponse } from \'next/server\';\nimport { EdgeAuth } from \'@/utils/edgeUtils\';');
    }
    
    // 替换 JWT 函数调用
    content = content.replace(/jwt\.sign\(/g, 'EdgeAuth.createJWT(');
    content = content.replace(/jwt\.verify\(/g, 'EdgeAuth.verifyJWT(');
    
    changed = true;
    console.log('   🔄 替换 jsonwebtoken 为 EdgeAuth');
  }
  
  // 替换 next-auth
  if (content.includes('next-auth')) {
    content = content.replace(/import.*getServerSession.*from ['"]next-auth['"];?\n?/g, '');
    content = content.replace(/getServerSession\(/g, '// getServerSession( // 需要手动实现认证');
    
    changed = true;
    console.log('   ⚠️  替换 next-auth (需要手动实现认证)');
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
  }
}

// 主函数
function main() {
  const apiRoutes = getAllApiRoutes();
  
  if (apiRoutes.length === 0) {
    console.log('❌ 没有找到 API 路由文件');
    return;
  }
  
  console.log(`📊 找到 ${apiRoutes.length} 个 API 路由文件\n`);
  
  apiRoutes.forEach(filePath => {
    try {
      // 先替换不兼容的导入
      replaceIncompatibleImports(filePath);
      // 然后强制配置 Edge Runtime
      forceEdgeRuntime(filePath);
    } catch (error) {
      console.error(`   ❌ 处理 ${filePath} 失败:`, error.message);
    }
  });
  
  console.log('\n📊 处理完成！');
  console.log('\n⚠️  重要提醒：');
  console.log('- 所有 API 路由现在都配置为 Edge Runtime');
  console.log('- 一些复杂功能可能需要手动调整');
  console.log('- 建议测试所有 API 功能是否正常');
  
  console.log('\n🚀 下一步：');
  console.log('git add . && git commit -m "force: configure all APIs for Edge Runtime" && git push');
}

main();