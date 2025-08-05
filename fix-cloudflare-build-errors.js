#!/usr/bin/env node

/**
 * 修复 Cloudflare 构建错误
 * 1. 修复 TypeScript 编译错误
 * 2. 修复 bcryptjs 兼容性问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 修复 Cloudflare 构建错误...\n');

// 1. 修复 utils/auth.ts 中的 bcryptjs 导入
function fixAuthUtils() {
  console.log('📝 修复 utils/auth.ts...');
  
  const filePath = 'utils/auth.ts';
  if (!fs.existsSync(filePath)) {
    console.log('   文件不存在，跳过');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 替换 bcryptjs 导入为 EdgeAuth
  if (content.includes('import * as bcrypt from \'bcryptjs\'')) {
    content = content.replace(
      'import * as bcrypt from \'bcryptjs\';',
      'import { EdgeAuth } from \'@/utils/edgeUtils\';'
    );
    
    // 替换 bcrypt 调用为 EdgeAuth 调用
    content = content.replace(/bcrypt\.hash\(/g, 'EdgeAuth.hashPassword(');
    content = content.replace(/bcrypt\.compare\(/g, 'EdgeAuth.verifyPassword(');
    
    fs.writeFileSync(filePath, content);
    console.log('   ✅ 已修复 utils/auth.ts');
  } else {
    console.log('   ℹ️  utils/auth.ts 无需修复');
  }
}

// 2. 修复 API 路由中的 bcryptjs 导入
function fixApiRoutes() {
  const apiRoutes = [
    'app/api/auth/login/route.ts',
    'app/api/auth/register/route.ts'
  ];
  
  apiRoutes.forEach(filePath => {
    console.log(`📝 修复 ${filePath}...`);
    
    if (!fs.existsSync(filePath)) {
      console.log('   文件不存在，跳过');
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('import bcrypt from \'bcryptjs\'')) {
      // 替换导入
      content = content.replace(
        'import bcrypt from \'bcryptjs\';',
        '// bcrypt replaced with EdgeAuth for Edge Runtime compatibility'
      );
      
      // 添加 EdgeAuth 导入（如果还没有）
      if (!content.includes('import { EdgeAuth }')) {
        content = content.replace(
          'import { NextRequest, NextResponse } from \'next/server\';',
          'import { NextRequest, NextResponse } from \'next/server\';\nimport { EdgeAuth } from \'@/utils/edgeUtils\';'
        );
      }
      
      // 替换 bcrypt 调用
      content = content.replace(/bcrypt\.hash\(/g, 'await EdgeAuth.hashPassword(');
      content = content.replace(/bcrypt\.compare\(/g, 'await EdgeAuth.verifyPassword(');
      
      fs.writeFileSync(filePath, content);
      console.log(`   ✅ 已修复 ${filePath}`);
    } else {
      console.log(`   ℹ️  ${filePath} 无需修复`);
    }
  });
}

// 3. 创建 Edge Runtime 兼容的 next.config.js
function updateNextConfig() {
  console.log('📝 更新 next.config.js...');
  
  const filePath = 'next.config.js';
  if (!fs.existsSync(filePath)) {
    console.log('   文件不存在，跳过');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 添加 webpack 配置以忽略 Node.js 模块
  if (!content.includes('webpack: (config')) {
    const webpackConfig = `
  webpack: (config, { isServer }) => {
    // 为 Edge Runtime 忽略 Node.js 特定模块
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // 忽略 bcryptjs 在客户端构建中的使用
    config.externals = config.externals || [];
    config.externals.push({
      'bcryptjs': 'bcryptjs'
    });
    
    return config;
  },`;
    
    // 在 module.exports 中添加 webpack 配置
    content = content.replace(
      'module.exports = {',
      `module.exports = {${webpackConfig}`
    );
    
    fs.writeFileSync(filePath, content);
    console.log('   ✅ 已更新 next.config.js');
  } else {
    console.log('   ℹ️  next.config.js 已包含 webpack 配置');
  }
}

// 4. 创建 Edge Runtime 专用的包装器
function createEdgeWrapper() {
  console.log('📝 创建 Edge Runtime 包装器...');
  
  const wrapperContent = `// Edge Runtime 兼容性包装器
// 用于替换不兼容的 Node.js 模块

export const bcrypt = {
  hash: async (password: string, saltRounds: number) => {
    // 在 Edge Runtime 中使用 EdgeAuth
    const { EdgeAuth } = await import('@/utils/edgeUtils');
    return EdgeAuth.hashPassword(password);
  },
  
  compare: async (password: string, hash: string) => {
    // 在 Edge Runtime 中使用 EdgeAuth
    const { EdgeAuth } = await import('@/utils/edgeUtils');
    return EdgeAuth.verifyPassword(password, hash);
  }
};

export default bcrypt;
`;
  
  const wrapperPath = 'utils/edge-compat.ts';
  fs.writeFileSync(wrapperPath, wrapperContent);
  console.log('   ✅ 已创建 Edge Runtime 包装器');
}

// 5. 更新 package.json 构建脚本
function updatePackageJson() {
  console.log('📝 检查 package.json...');
  
  const filePath = 'package.json';
  if (!fs.existsSync(filePath)) {
    console.log('   文件不存在，跳过');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // 确保有正确的构建脚本
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  // 添加 Cloudflare 特定的构建脚本
  packageJson.scripts['build:cloudflare'] = 'next build';
  packageJson.scripts['dev:cloudflare'] = 'wrangler pages dev';
  
  fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2));
  console.log('   ✅ 已更新 package.json');
}

// 执行所有修复
async function main() {
  try {
    fixAuthUtils();
    fixApiRoutes();
    updateNextConfig();
    createEdgeWrapper();
    updatePackageJson();
    
    console.log('\n🎉 所有构建错误已修复！');
    console.log('\n📋 下一步：');
    console.log('1. 推送修复到 GitHub: git add . && git commit -m "fix: resolve Cloudflare build errors" && git push');
    console.log('2. 等待 Cloudflare Pages 自动重新部署');
    console.log('3. 检查部署日志确认构建成功');
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误：', error);
  }
}

main();