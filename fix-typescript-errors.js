#!/usr/bin/env node

/**
 * 修复 TypeScript 错误
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 修复 TypeScript 错误...\n');

// 获取所有 API 路由文件
function getAllApiRoutes() {
  try {
    const result = execSync('find app/api -name "route.ts" -type f', { encoding: 'utf8' });
    return result.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    return [];
  }
}

function fixTypeScriptErrors(filePath) {
  console.log(`📝 修复 ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log('   文件不存在，跳过');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // 修复 session 类型错误
  if (content.includes('const session = null; // 临时禁用认证')) {
    // 替换为更好的类型处理
    content = content.replace(
      'const session = null; // 临时禁用认证',
      'const session: any = null; // 临时禁用认证 - Edge Runtime 兼容'
    );
    changed = true;
    console.log('   🔄 修复 session 类型错误');
  }
  
  // 修复其他常见的类型错误
  if (content.includes('session.user') && content.includes('const session: any = null')) {
    // 添加类型保护
    content = content.replace(
      /if \(!session \|\| !session\.user \|\| !\(session\.user as any\)\.id\) {/g,
      'if (!session || !session?.user || !session?.user?.id) {'
    );
    changed = true;
    console.log('   🔄 添加类型保护');
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('   ✅ TypeScript 错误已修复');
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
      fixTypeScriptErrors(filePath);
    } catch (error) {
      console.error(`   ❌ 处理 ${filePath} 失败:`, error.message);
    }
  });
  
  console.log('\n🎉 TypeScript 错误修复完成！');
}

main();