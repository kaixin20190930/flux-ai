/**
 * 将 Neon PostgreSQL 数据迁移到 Cloudflare D1
 */

import * as fs from 'fs';
import * as path from 'path';

async function migrateToD1() {
  console.log('🔄 开始将 Neon 数据迁移到 D1...\n');
  
  // 读取备份数据
  const backupDirs = fs.readdirSync('backups').filter(f => 
    fs.statSync(path.join('backups', f)).isDirectory()
  );
  
  if (backupDirs.length === 0) {
    console.error('❌ 没有找到备份数据！请先运行 backup-neon-data.ts');
    process.exit(1);
  }
  
  // 使用最新的备份
  const latestBackup = backupDirs.sort().reverse()[0];
  const backupDir = path.join('backups', latestBackup);
  
  console.log(`📁 使用备份：${backupDir}\n`);
  
  // 读取用户数据
  const usersFile = path.join(backupDir, 'users.json');
  if (!fs.existsSync(usersFile)) {
    console.error('❌ 用户数据文件不存在！');
    process.exit(1);
  }
  
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
  
  console.log(`👥 找到 ${users.length} 个用户\n`);
  
  // 生成 SQL 插入语句
  const sqlStatements: string[] = [];
  
  for (const user of users) {
    // 检查是否是 Google 用户
    const isGoogleUser = user.accounts && user.accounts.length > 0 && 
                        user.accounts.some((acc: any) => acc.provider === 'google');
    
    const sql = `INSERT INTO users (name, email, password, points, is_google_user, created_at) 
VALUES (
  '${user.name?.replace(/'/g, "''")}', 
  '${user.email.replace(/'/g, "''")}', 
  '${user.password?.replace(/'/g, "''") || ''}', 
  ${user.points || 0}, 
  ${isGoogleUser ? 1 : 0},
  '${user.createdAt}'
);`;
    
    sqlStatements.push(sql);
  }
  
  // 保存 SQL 文件
  const sqlFile = path.join(backupDir, 'migrate-to-d1.sql');
  fs.writeFileSync(sqlFile, sqlStatements.join('\n\n'));
  
  console.log(`✅ SQL 迁移文件已生成：${sqlFile}\n`);
  console.log('📝 下一步：运行以下命令将数据导入 D1：\n');
  console.log(`   wrangler d1 execute flux-ai-db --remote --file="${sqlFile}"\n`);
  console.log('⚠️  注意：如果用户已存在，可能会报错。这是正常的。\n');
}

migrateToD1().catch(console.error);
