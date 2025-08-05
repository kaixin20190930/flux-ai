#!/usr/bin/env node

/**
 * 迁移关键 API 到 Edge Runtime
 * 优先迁移最重要的功能
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 迁移关键 API 到 Edge Runtime...\n');

// 需要迁移的关键 API
const criticalAPIs = [
  'app/api/generate/route.ts',
  'app/api/getRemainingGenerations/route.ts',
  'app/api/user/profile/route.ts',
  'app/api/health/route.ts'
];

function addEdgeRuntime(filePath) {
  console.log(`📝 处理 ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log('   文件不存在，跳过');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 检查是否已经有 runtime 配置
  if (content.includes('export const runtime')) {
    if (content.includes('runtime = \'edge\'')) {
      console.log('   ✅ 已配置为 Edge Runtime');
      return;
    } else if (content.includes('runtime = \'nodejs\'')) {
      console.log('   ⚠️  已配置为 Node.js Runtime，需要手动检查兼容性');
      return;
    }
  }
  
  // 检查是否使用了不兼容的库
  const incompatiblePatterns = [
    /import.*bcryptjs/,
    /import.*jsonwebtoken/,
    /import.*next-auth/,
    /require\(['"]fs['"]\)/,
    /require\(['"]path['"]\)/,
    /process\.env\./
  ];
  
  const hasIncompatible = incompatiblePatterns.some(pattern => pattern.test(content));
  
  if (hasIncompatible) {
    console.log('   ⚠️  检测到不兼容的库，需要手动迁移');
    return;
  }
  
  // 添加 Edge Runtime 配置
  const lines = content.split('\n');
  let insertIndex = -1;
  
  // 找到合适的插入位置（在导入之后，在第一个 export function 之前）
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('export async function') || lines[i].startsWith('export function')) {
      insertIndex = i;
      break;
    }
  }
  
  if (insertIndex === -1) {
    console.log('   ⚠️  找不到合适的插入位置');
    return;
  }
  
  // 插入 Edge Runtime 配置
  lines.splice(insertIndex, 0, '', '// 配置为 Edge Runtime', 'export const runtime = \'edge\';', 'export const dynamic = \'force-dynamic\';');
  
  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent);
  
  console.log('   ✅ 已添加 Edge Runtime 配置');
}

// 处理所有关键 API
criticalAPIs.forEach(addEdgeRuntime);

console.log('\n📊 迁移总结：');
console.log('- 已检查关键 API 的 Edge Runtime 兼容性');
console.log('- 为兼容的 API 添加了 Edge Runtime 配置');
console.log('- 不兼容的 API 保持 Node.js Runtime');

console.log('\n🎯 建议：');
console.log('1. 测试迁移后的 API 功能是否正常');
console.log('2. 对于复杂的 API，考虑创建 Edge 版本（如 *-edge 路由）');
console.log('3. 逐步迁移，确保每个功能都能正常工作');

console.log('\n🚀 下一步：');
console.log('git add . && git commit -m "feat: migrate critical APIs to Edge Runtime" && git push');