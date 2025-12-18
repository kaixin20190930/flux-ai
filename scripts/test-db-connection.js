#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 测试数据库连接...');
    
    // 尝试连接数据库
    await prisma.$connect();
    console.log('✅ 数据库连接成功！');
    
    // 检查表是否存在
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('\n📊 数据库表:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    await prisma.$disconnect();
    console.log('\n✅ 数据库配置正确！');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 数据库连接失败:');
    console.error(error.message);
    console.log('\n请检查:');
    console.log('1. PostgreSQL 是否正在运行');
    console.log('2. .env.local 中的 DATABASE_URL 是否正确');
    console.log('3. 数据库 fluxai 是否已创建');
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
