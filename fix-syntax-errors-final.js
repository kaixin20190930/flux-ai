#!/usr/bin/env node

/**
 * 修复语法错误
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 修复语法错误...\n');

// 获取所有 API 路由文件
function getAllApiRoutes() {
  try {
    const result = execSync('find app/api -name "route.ts" -type f', { encoding: 'utf8' });
    return result.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    return [];
  }
}

function fixSyntaxErrors(filePath) {
  console.log(`📝 修复 ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log('   文件不存在，跳过');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // 修复注释语法错误
  if (content.includes('await // getServerSession( // 需要手动实现认证);')) {
    content = content.replace(
      /const session = await \/\/ getServerSession\( \/\/ 需要手动实现认证\);/g,
      '// const session = await getServerSession(); // 需要手动实现认证\n    const session = null; // 临时禁用认证'
    );
    changed = true;
    console.log('   🔄 修复 getServerSession 注释语法');
  }
  
  // 修复重复的 dynamic 导出
  const dynamicMatches = content.match(/export const dynamic = ['"]force-dynamic['"];?/g);
  if (dynamicMatches && dynamicMatches.length > 1) {
    // 保留第一个，移除其他的
    let firstFound = false;
    content = content.replace(/export const dynamic = ['"]force-dynamic['"];?\n?/g, (match) => {
      if (!firstFound) {
        firstFound = true;
        return match;
      }
      return '';
    });
    changed = true;
    console.log('   🔄 移除重复的 dynamic 导出');
  }
  
  // 修复重复的 runtime 导出
  const runtimeMatches = content.match(/export const runtime = ['"]edge['"];?/g);
  if (runtimeMatches && runtimeMatches.length > 1) {
    let firstFound = false;
    content = content.replace(/export const runtime = ['"]edge['"];?\n?/g, (match) => {
      if (!firstFound) {
        firstFound = true;
        return match;
      }
      return '';
    });
    changed = true;
    console.log('   🔄 移除重复的 runtime 导出');
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('   ✅ 语法错误已修复');
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
      fixSyntaxErrors(filePath);
    } catch (error) {
      console.error(`   ❌ 处理 ${filePath} 失败:`, error.message);
    }
  });
  
  console.log('\n🎉 语法错误修复完成！');
}

main();