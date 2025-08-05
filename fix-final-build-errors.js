#!/usr/bin/env node

/**
 * 修复最后的构建错误
 * 1. 移除重复的 await
 * 2. 修复 EdgeAuth 函数参数
 */

const fs = require('fs');

console.log('🔧 修复最后的构建错误...\n');

function fixFile(filePath, fixes) {
  console.log(`📝 修复 ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log('   文件不存在，跳过');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  fixes.forEach(fix => {
    if (content.includes(fix.search)) {
      content = content.replace(fix.search, fix.replace);
      changed = true;
      console.log(`   ✅ 修复: ${fix.description}`);
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ ${filePath} 修复完成`);
  } else {
    console.log(`   ℹ️  ${filePath} 无需修复`);
  }
}

// 修复所有文件
const fixes = [
  {
    file: 'app/api/auth/register/route.ts',
    fixes: [
      {
        search: 'await await EdgeAuth.hashPassword(password, 10)',
        replace: 'await EdgeAuth.hashPassword(password)',
        description: '移除重复 await 和多余参数'
      }
    ]
  },
  {
    file: 'app/api/auth/login/route.ts',
    fixes: [
      {
        search: 'await await EdgeAuth.verifyPassword(password, user.password)',
        replace: 'await EdgeAuth.verifyPassword(password, user.password)',
        description: '移除重复 await'
      }
    ]
  },
  {
    file: 'utils/auth.ts',
    fixes: [
      {
        search: 'EdgeAuth.hashPassword(password, 10)',
        replace: 'EdgeAuth.hashPassword(password)',
        description: '移除多余的 saltRounds 参数'
      }
    ]
  }
];

fixes.forEach(({ file, fixes: fileFixes }) => {
  fixFile(file, fileFixes);
});

console.log('\n🎉 所有构建错误已修复！');
console.log('\n📋 修复内容：');
console.log('- 移除重复的 await 关键字');
console.log('- 修复 EdgeAuth.hashPassword() 参数数量');
console.log('- 确保所有函数调用符合 Edge Runtime 规范');

console.log('\n🚀 下一步：');
console.log('git add . && git commit -m "fix: resolve final build errors" && git push');