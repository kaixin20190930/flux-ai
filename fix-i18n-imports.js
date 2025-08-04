#!/usr/bin/env node

const fs = require('fs');

// 修复所有i18n导入问题
const files = [
  'app/page.tsx',
  'app/layout.tsx',
  'app/[locale]/flux-1-1-ultra/page.tsx',
  'app/[locale]/create/page.tsx',
  'app/[locale]/layout.tsx',
  'app/[locale]/image-search/page.tsx',
  'app/[locale]/pricing/page.tsx',
  'app/[locale]/flux-tools/flux-depth/page.tsx',
  'app/[locale]/page.tsx',
  'app/[locale]/flux-tools/flux-fill/page.tsx',
  'app/[locale]/flux-tools/flux-redux/page.tsx',
  'app/[locale]/flux-tools/flux-canny/page.tsx'
];

console.log('🔧 修复i18n导入问题...');

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    // 替换导入语句
    content = content.replace(/import\s*\{\s*get\s*\}\s*from\s*['"]([^'"]*i18n\/utils)['"]/g, 'import {getany} from \'$1\'');
    
    // 替换函数调用
    content = content.replace(/await\s+get\(/g, 'await getany(');
    content = content.replace(/get\(/g, 'getany(');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      console.log(`✅ Fixed i18n imports in ${file}`);
    }
  }
});

console.log('✨ i18n导入修复完成！');