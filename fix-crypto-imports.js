#!/usr/bin/env node

/**
 * 修复 crypto 导入问题
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 修复 crypto 导入问题...\n');

// 获取所有 API 路由文件
function getAllApiRoutes() {
  try {
    const result = execSync('find app/api -name "route.ts" -type f', { encoding: 'utf8' });
    return result.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    return [];
  }
}

function fixCryptoImports(filePath) {
  console.log(`📝 修复 ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log('   文件不存在，跳过');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // 替换 crypto 导入
  if (content.includes("import { randomUUID } from 'crypto';")) {
    content = content.replace(
      "import { randomUUID } from 'crypto';",
      "import { generateUUID } from '@/utils/edgeUtils';"
    );
    
    // 替换函数调用
    content = content.replace(/randomUUID\(\)/g, 'generateUUID()');
    
    changed = true;
    console.log('   🔄 替换 crypto.randomUUID 为 generateUUID');
  }
  
  // 替换其他 crypto 相关导入
  if (content.includes("import crypto from 'crypto';") || content.includes("import * as crypto from 'crypto';")) {
    content = content.replace(/import \* as crypto from ['"]crypto['"];?\n?/g, '');
    content = content.replace(/import crypto from ['"]crypto['"];?\n?/g, '');
    
    if (!content.includes("import { generateUUID, simpleHash } from '@/utils/edgeUtils';")) {
      content = content.replace(
        "import { NextRequest, NextResponse } from 'next/server';",
        "import { NextRequest, NextResponse } from 'next/server';\nimport { generateUUID, simpleHash } from '@/utils/edgeUtils';"
      );
    }
    
    // 替换常见的 crypto 调用
    content = content.replace(/crypto\.randomUUID\(\)/g, 'generateUUID()');
    content = content.replace(/crypto\.createHash\(['"]sha256['"]\)\.update\([^)]+\)\.digest\(['"]hex['"]\)/g, 'await simpleHash($1)');
    
    changed = true;
    console.log('   🔄 替换 crypto 模块导入');
  }
  
  // 修复 process.env 访问（在某些情况下）
  if (content.includes('process.env.') && !content.includes('// Edge Runtime compatible')) {
    // 添加注释说明
    content = '// Edge Runtime compatible\n' + content;
    console.log('   ℹ️  添加 Edge Runtime 兼容性注释');
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('   ✅ crypto 导入已修复');
  } else {
    console.log('   ℹ️  无需修复');
  }
}

// 主函数
function main() {
  const apiRoutes = getAllApiRoutes();
  
  console.log(`📊 检查 ${apiRoutes.length} 个 API 路由文件\n`);
  
  apiRoutes.forEach(filePath => {
    try {
      fixCryptoImports(filePath);
    } catch (error) {
      console.error(`   ❌ 处理 ${filePath} 失败:`, error.message);
    }
  });
  
  console.log('\n🎉 crypto 导入修复完成！');
}

main();