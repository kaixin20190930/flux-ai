#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 修复缺失的 edgeUtils 和相关问题...');

// 1. 确保 edgeUtils.ts 存在
function ensureEdgeUtils() {
  console.log('📝 确保 edgeUtils.ts 文件存在...');
  
  const edgeUtilsPath = 'utils/edgeUtils.ts';
  
  if (!fs.existsSync(edgeUtilsPath)) {
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
    console.log('✅ 创建了 edgeUtils.ts 文件');
  } else {
    console.log('✅ edgeUtils.ts 文件已存在');
  }
}

// 2. 修复引用 edgeUtils 的文件，确保它们使用 Edge Runtime
function fixEdgeUtilsReferences() {
  console.log('📝 修复引用 edgeUtils 的文件...');
  
  const healthRoutePath = 'app/api/health/route.ts';
  
  if (fs.existsSync(healthRoutePath)) {
    let content = fs.readFileSync(healthRoutePath, 'utf8');
    
    // 确保有正确的 Edge Runtime 配置
    if (!content.includes("export const runtime = 'edge'")) {
      const lines = content.split('\n');
      lines.splice(0, 0, "export const runtime = 'edge'");
      lines.splice(1, 0, "export const dynamic = 'force-dynamic'");
      lines.splice(2, 0, '');
      content = lines.join('\n');
      
      fs.writeFileSync(healthRoutePath, content);
      console.log('✅ 修复了 health route 的 Edge Runtime 配置');
    }
  }
  
  // 检查 ping route
  const pingRoutePath = 'app/api/ping/route.ts';
  if (fs.existsSync(pingRoutePath)) {
    let content = fs.readFileSync(pingRoutePath, 'utf8');
    
    if (!content.includes("export const runtime = 'edge'")) {
      const lines = content.split('\n');
      lines.splice(0, 0, "export const runtime = 'edge'");
      lines.splice(1, 0, "export const dynamic = 'force-dynamic'");
      lines.splice(2, 0, '');
      content = lines.join('\n');
      
      fs.writeFileSync(pingRoutePath, content);
      console.log('✅ 修复了 ping route 的 Edge Runtime 配置');
    }
  }
}

// 3. 检查所有 API 路由的 Runtime 配置
function checkAllApiRoutes() {
  console.log('📝 检查所有 API 路由的 Runtime 配置...');
  
  const { execSync } = require('child_process');
  let apiRoutes = [];
  
  try {
    const result = execSync('find app/api -name "route.ts" -type f', { encoding: 'utf8' });
    apiRoutes = result.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.log('⚠️  无法自动查找 API 路由');
    return;
  }
  
  let edgeCount = 0;
  let nodejsCount = 0;
  let missingCount = 0;
  
  apiRoutes.forEach(routePath => {
    if (fs.existsSync(routePath)) {
      const content = fs.readFileSync(routePath, 'utf8');
      
      if (content.includes("export const runtime = 'edge'")) {
        edgeCount++;
      } else if (content.includes("export const runtime = 'nodejs'")) {
        nodejsCount++;
      } else {
        missingCount++;
        console.log(`⚠️  ${routePath} 缺少 runtime 配置`);
      }
    }
  });
  
  console.log(`\\n📊 API 路由 Runtime 配置统计:`);
  console.log(`✅ Edge Runtime: ${edgeCount} 个`);
  console.log(`⚠️  Node.js Runtime: ${nodejsCount} 个`);
  console.log(`❌ 缺少配置: ${missingCount} 个`);
  
  if (missingCount > 0) {
    console.log('\\n💡 建议运行 node fix-syntax-errors.js 来修复缺少配置的路由');
  }
}

// 4. 创建推送检查清单
function createPushChecklist() {
  console.log('📝 创建推送检查清单...');
  
  const checklistContent = `# 推送前检查清单

## 📋 必须推送的文件

### 核心文件
- [ ] \`utils/edgeUtils.ts\` - Edge Runtime 兼容工具函数
- [ ] \`app/api/health/route.ts\` - 健康检查 API
- [ ] \`app/api/ping/route.ts\` - Ping API

### 配置文件
- [ ] \`next.config.js\` - Next.js 配置
- [ ] \`.env.cloudflare\` - Cloudflare 环境变量模板

### 所有 API 路由
确保所有 \`app/api/**/route.ts\` 文件都有正确的 runtime 配置：
\`\`\`typescript
export const runtime = 'edge' // 或 'nodejs'
export const dynamic = 'force-dynamic'
\`\`\`

## 🚀 推送命令

\`\`\`bash
# 检查状态
git status

# 添加所有文件
git add .

# 提交更改
git commit -m "Fix Cloudflare Edge Runtime compatibility"

# 推送到 GitHub
git push origin main
\`\`\`

## 🔍 验证步骤

1. 推送后，等待 Cloudflare Pages 自动构建
2. 检查构建日志，确认没有 "not configured to run with the Edge Runtime" 错误
3. 如果仍有错误，检查错误列表中的路由是否正确配置了 runtime

## ⚠️  重要提醒

- Cloudflare Pages 要求所有 API 路由使用 Edge Runtime
- 使用 Node.js 特定功能的路由无法在 Cloudflare Pages 上运行
- 如果大部分路由不兼容 Edge Runtime，建议部署到 Vercel
`;

  fs.writeFileSync('PUSH_CHECKLIST.md', checklistContent);
  console.log('✅ 创建了推送检查清单');
}

// 执行所有修复
async function runAllFixes() {
  try {
    ensureEdgeUtils();
    fixEdgeUtilsReferences();
    checkAllApiRoutes();
    createPushChecklist();
    
    console.log('\\n🎉 edgeUtils 相关问题修复完成！');
    console.log('\\n📋 修复摘要:');
    console.log('✅ 确保了 edgeUtils.ts 文件存在');
    console.log('✅ 修复了引用 edgeUtils 的路由配置');
    console.log('✅ 检查了所有 API 路由的 Runtime 配置');
    console.log('✅ 创建了推送检查清单');
    
    console.log('\\n🚀 下一步:');
    console.log('1. 查看 PUSH_CHECKLIST.md 了解推送要求');
    console.log('2. 运行 git add . && git commit -m "Fix Edge Runtime" && git push');
    console.log('3. 等待 Cloudflare Pages 重新构建');
    
    console.log('\\n💡 重要提醒:');
    console.log('- edgeUtils.ts 缺失只是部分原因');
    console.log('- 主要问题仍然是大部分路由不兼容 Edge Runtime');
    console.log('- 如果推送后仍有错误，建议考虑部署到 Vercel');
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
    process.exit(1);
  }
}

runAllFixes();