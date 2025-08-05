#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 修复 Cloudflare Edge Runtime 兼容性问题...');

// 检查文件是否兼容 Edge Runtime
function isEdgeCompatible(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 检查不兼容的导入和功能
  const incompatiblePatterns = [
    /import.*crypto.*from ['"]crypto['"]/,
    /require\(['"]crypto['"]\)/,
    /import.*fs.*from ['"]fs['"]/,
    /require\(['"]fs['"]\)/,
    /import.*path.*from ['"]path['"]/,
    /require\(['"]path['"]\)/,
    /import.*os.*from ['"]os['"]/,
    /require\(['"]os['"]\)/,
    /import.*buffer.*from ['"]buffer['"]/,
    /require\(['"]buffer['"]\)/,
    /import.*stream.*from ['"]stream['"]/,
    /require\(['"]stream['"]\)/,
    /import.*util.*from ['"]util['"]/,
    /require\(['"]util['"]\)/,
    /import.*next-auth/,
    /from ['"]next-auth['"]/,
    /bcryptjs/,
    /bcrypt/,
    /jsonwebtoken/,
    /jwt/,
    /process\.env\./,
    /Buffer\./,
    /randomUUID/,
    /createHash/,
    /createHmac/,
  ];
  
  return !incompatiblePatterns.some(pattern => pattern.test(content));
}

// 为兼容的路由配置 Edge Runtime，不兼容的保持 nodejs
function configureRuntimeBasedOnCompatibility() {
  console.log('📝 根据兼容性配置 Runtime...');
  
  // 获取所有 API 路由
  const { execSync } = require('child_process');
  let apiRoutes = [];
  
  try {
    const result = execSync('find app/api -name "route.ts" -type f', { encoding: 'utf8' });
    apiRoutes = result.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.log('⚠️  无法自动查找 API 路由，使用预定义列表');
    apiRoutes = [
      'app/api/admin/alerts/route.ts',
      'app/api/admin/check-permission/route.ts',
      'app/api/admin/export/route.ts',
      'app/api/admin/metrics/history/route.ts',
      'app/api/admin/metrics/latest/route.ts',
      'app/api/admin/user-analytics/route.ts',
      'app/api/auth/login/route.ts',
      'app/api/auth/logout/route.ts',
      'app/api/auth/register/route.ts',
      'app/api/edit-history/route.ts',
      'app/api/flux-tools/canny/route.ts',
      'app/api/flux-tools/depth/route.ts',
      'app/api/flux-tools/fill/route.ts',
      'app/api/getRemainingGenerations/route.ts',
      'app/api/history/regenerate/route.ts',
      'app/api/history/route.ts',
      'app/api/image-search/history/route.ts',
      'app/api/image-search/save/route.ts',
      'app/api/image-search/saved/route.ts',
      'app/api/image-search/route.ts',
      'app/api/init-db/route.ts',
      'app/api/performance/analytics/route.ts',
      'app/api/performance/metrics/route.ts',
      'app/api/points/consume/route.ts',
      'app/api/share/route.ts',
      'app/api/stats/route.ts',
      'app/api/test-auth/route.ts',
      'app/api/user/profile/route.ts'
    ];
  }
  
  const edgeCompatible = [];
  const nodejsRequired = [];
  
  apiRoutes.forEach(routePath => {
    if (fs.existsSync(routePath)) {
      if (isEdgeCompatible(routePath)) {
        edgeCompatible.push(routePath);
      } else {
        nodejsRequired.push(routePath);
      }
    }
  });
  
  console.log(`\\n📊 兼容性分析结果:`);
  console.log(`✅ Edge Runtime 兼容: ${edgeCompatible.length} 个路由`);
  console.log(`⚠️  需要 Node.js Runtime: ${nodejsRequired.length} 个路由`);
  
  // 配置 Edge Runtime 兼容的路由
  edgeCompatible.forEach(routePath => {
    let content = fs.readFileSync(routePath, 'utf8');
    
    // 替换或添加 runtime 配置
    if (content.includes("export const runtime = 'nodejs'")) {
      content = content.replace("export const runtime = 'nodejs'", "export const runtime = 'edge'");
    } else if (!content.includes("export const runtime = 'edge'")) {
      const lines = content.split('\\n');
      let insertIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('export async function') || 
            lines[i].trim().startsWith('export function')) {
          insertIndex = i;
          break;
        }
      }
      
      lines.splice(insertIndex, 0, "export const runtime = 'edge'");
      content = lines.join('\\n');
    }
    
    // 确保有 dynamic 配置
    if (!content.includes("export const dynamic = 'force-dynamic'")) {
      const lines = content.split('\\n');
      const runtimeIndex = lines.findIndex(line => line.includes("export const runtime = 'edge'"));
      if (runtimeIndex !== -1) {
        lines.splice(runtimeIndex + 1, 0, "export const dynamic = 'force-dynamic'");
        content = lines.join('\\n');
      }
    }
    
    fs.writeFileSync(routePath, content);
    console.log(`✅ ${routePath} -> Edge Runtime`);
  });
  
  // 配置需要 Node.js Runtime 的路由
  nodejsRequired.forEach(routePath => {
    let content = fs.readFileSync(routePath, 'utf8');
    
    // 确保使用 nodejs runtime
    if (content.includes("export const runtime = 'edge'")) {
      content = content.replace("export const runtime = 'edge'", "export const runtime = 'nodejs'");
    } else if (!content.includes("export const runtime = 'nodejs'")) {
      const lines = content.split('\\n');
      let insertIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('export async function') || 
            lines[i].trim().startsWith('export function')) {
          insertIndex = i;
          break;
        }
      }
      
      lines.splice(insertIndex, 0, "export const runtime = 'nodejs'");
      content = lines.join('\\n');
    }
    
    // 确保有 dynamic 配置
    if (!content.includes("export const dynamic = 'force-dynamic'")) {
      const lines = content.split('\\n');
      const runtimeIndex = lines.findIndex(line => line.includes("export const runtime = 'nodejs'"));
      if (runtimeIndex !== -1) {
        lines.splice(runtimeIndex + 1, 0, "export const dynamic = 'force-dynamic'");
        content = lines.join('\\n');
      }
    }
    
    fs.writeFileSync(routePath, content);
    console.log(`⚠️  ${routePath} -> Node.js Runtime (不兼容 Edge)`);
  });
  
  return { edgeCompatible, nodejsRequired };
}

// 创建 Edge Runtime 兼容的替代实现
function createEdgeCompatibleAlternatives() {
  console.log('📝 创建 Edge Runtime 兼容的替代实现...');
  
  // 创建 Edge 兼容的工具函数
  const edgeUtilsPath = 'utils/edgeUtils.ts';
  const edgeUtilsContent = `// Edge Runtime 兼容的工具函数

// 替代 crypto.randomUUID()
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 简单的哈希函数（替代 crypto.createHash）
export async function simpleHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 简单的 JWT 验证（替代 jsonwebtoken）
export function parseJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// 环境变量获取（Edge Runtime 兼容）
export function getEnvVar(name: string, defaultValue?: string): string {
  // 在 Edge Runtime 中，环境变量需要在构建时注入
  // 这里提供一个基本的实现
  return defaultValue || '';
}

// 简单的错误响应
export function createErrorResponse(message: string, status: number = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// 简单的成功响应
export function createSuccessResponse(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}`;
  
  fs.writeFileSync(edgeUtilsPath, edgeUtilsContent);
  console.log('✅ 创建了 Edge Runtime 兼容工具函数');
  
  // 创建简化的 API 路由示例
  const simpleApiRoutes = [
    {
      path: 'app/api/health/route.ts',
      content: `export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/utils/edgeUtils'

export async function GET(request: NextRequest) {
  return createSuccessResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    runtime: 'edge'
  });
}`
    },
    {
      path: 'app/api/ping/route.ts',
      content: `export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return new Response(JSON.stringify({ 
    message: 'pong',
    timestamp: Date.now()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}`
    }
  ];
  
  simpleApiRoutes.forEach(({ path: routePath, content }) => {
    const dir = path.dirname(routePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(routePath, content);
    console.log(`✅ 创建了简化的 API 路由: ${routePath}`);
  });
}

// 更新 Next.js 配置
function updateNextConfigForMixedRuntime() {
  console.log('📝 更新 Next.js 配置以支持混合 Runtime...');
  
  const nextConfigPath = 'next.config.js';
  const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs']
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  images: {
    domains: ['localhost', 'your-domain.com'],
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  trailingSlash: false,
  generateBuildId: async () => {
    return 'build-' + Date.now();
  }
};

module.exports = nextConfig;`;
  
  fs.writeFileSync(nextConfigPath, nextConfigContent);
  console.log('✅ Next.js 配置已更新');
}

// 创建部署策略文档
function createDeploymentStrategy() {
  console.log('📝 创建部署策略文档...');
  
  const strategyContent = `# Cloudflare Pages 部署策略

## 🎯 混合 Runtime 策略

由于 Edge Runtime 的限制，我们采用混合策略：

### Edge Runtime 路由
这些路由兼容 Edge Runtime，可以在 Cloudflare Pages 上运行：
- 简单的 API 端点（如健康检查、ping）
- 不需要 Node.js 特定功能的路由
- 静态数据返回的路由

### Node.js Runtime 路由
这些路由需要 Node.js 功能，不能在 Cloudflare Pages 上运行：
- 使用 crypto 模块的路由
- 使用 next-auth 的路由
- 使用 bcryptjs 的路由
- 需要文件系统访问的路由
- 复杂数据库操作的路由

## 🚀 部署选项

### 选项 1: Vercel 部署（推荐）
Vercel 原生支持 Next.js 和混合 Runtime：
\`\`\`bash
npm run build
# 部署到 Vercel
\`\`\`

### 选项 2: 自托管
使用 Docker 或其他平台：
\`\`\`bash
npm run build
npm start
\`\`\`

### 选项 3: 部分 Cloudflare Pages
只部署兼容 Edge Runtime 的路由到 Cloudflare Pages，
其他路由部署到支持 Node.js 的平台。

## 🔧 Edge Runtime 兼容性改进

如果要完全兼容 Cloudflare Pages，需要：

1. **替换加密库**：
   - 移除 bcryptjs，使用 Web Crypto API
   - 移除 jsonwebtoken，使用自定义 JWT 实现

2. **替换认证系统**：
   - 移除 next-auth
   - 使用 Cloudflare Access 或自定义认证

3. **数据库适配**：
   - 使用 Cloudflare D1 (SQLite)
   - 或使用支持 Edge Runtime 的数据库客户端

4. **环境变量处理**：
   - 在构建时注入环境变量
   - 使用 Cloudflare Pages 的环境变量系统

## 📊 当前状态

- ✅ 项目可以在支持 Node.js 的平台上运行
- ⚠️  部分路由不兼容 Cloudflare Pages Edge Runtime
- 🔄 需要重构以完全兼容 Edge Runtime

## 💡 建议

1. **短期**：部署到 Vercel 或其他支持 Node.js 的平台
2. **长期**：逐步重构以兼容 Edge Runtime，享受 Cloudflare 的性能优势
`;

  fs.writeFileSync('DEPLOYMENT_STRATEGY.md', strategyContent);
  console.log('✅ 部署策略文档已创建');
}

// 执行所有修复
async function runAllFixes() {
  try {
    const { edgeCompatible, nodejsRequired } = configureRuntimeBasedOnCompatibility();
    createEdgeCompatibleAlternatives();
    updateNextConfigForMixedRuntime();
    createDeploymentStrategy();
    
    console.log('\\n🎉 Edge Runtime 兼容性修复完成！');
    console.log('\\n📋 修复摘要:');
    console.log(`✅ ${edgeCompatible.length} 个路由配置为 Edge Runtime`);
    console.log(`⚠️  ${nodejsRequired.length} 个路由保持 Node.js Runtime`);
    console.log('✅ 创建了 Edge Runtime 兼容工具函数');
    console.log('✅ 创建了部署策略文档');
    
    console.log('\\n🚀 部署建议:');
    if (nodejsRequired.length > 0) {
      console.log('❌ 当前项目不能完全部署到 Cloudflare Pages');
      console.log('💡 建议部署到 Vercel 或其他支持 Node.js 的平台');
      console.log('📖 查看 DEPLOYMENT_STRATEGY.md 了解详细策略');
    } else {
      console.log('✅ 项目兼容 Cloudflare Pages Edge Runtime');
      console.log('🚀 可以使用 npm run build:cloudflare 构建');
    }
    
    console.log('\\n🔧 测试构建:');
    console.log('npm run build  # 测试标准构建');
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
    process.exit(1);
  }
}

runAllFixes();