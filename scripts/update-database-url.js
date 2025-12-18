#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取当前用户名
const username = execSync('whoami').toString().trim();

console.log(`📝 检测到用户名: ${username}`);

// 读取 .env.local 文件
const envPath = path.join(process.cwd(), '.env.local');
let envContent = fs.readFileSync(envPath, 'utf8');

// 更新 DATABASE_URL
const newDatabaseUrl = `DATABASE_URL="postgresql://${username}@localhost:5432/fluxai?schema=public"`;
const oldPattern = /DATABASE_URL="[^"]*"/;

if (oldPattern.test(envContent)) {
  envContent = envContent.replace(oldPattern, newDatabaseUrl);
  console.log('✅ 已更新 DATABASE_URL');
} else {
  console.log('❌ 未找到 DATABASE_URL 配置');
  process.exit(1);
}

// 写回文件
fs.writeFileSync(envPath, envContent, 'utf8');

console.log('');
console.log('✅ .env.local 文件已更新');
console.log(`新的 DATABASE_URL: postgresql://${username}@localhost:5432/fluxai?schema=public`);
console.log('');
console.log('下一步: 运行 npm run prisma:migrate:dev');
