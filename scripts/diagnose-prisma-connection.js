const { PrismaClient } = require('@prisma/client');

console.log('🔍 诊断 Prisma 连接配置...\n');

// 1. 检查环境变量
console.log('1️⃣ 环境变量检查:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '❌ 未设置');
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  console.log('  - 协议:', url.protocol);
  console.log('  - 主机:', url.hostname);
  console.log('  - 端口:', url.port || '默认');
  console.log('  - 数据库:', url.pathname.substring(1));
  console.log('  - 参数:', url.search);
}
console.log('');

// 2. 创建 Prisma Client 并检查配置
console.log('2️⃣ Prisma Client 配置:');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// 3. 尝试连接
console.log('3️⃣ 测试数据库连接...');
prisma.$connect()
  .then(() => {
    console.log('✅ 连接成功\n');
    
    // 4. 执行简单查询
    console.log('4️⃣ 执行测试查询...');
    return prisma.$queryRaw`SELECT current_database(), current_schema(), current_user`;
  })
  .then((result) => {
    console.log('✅ 查询成功:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');
    
    // 5. 检查表
    console.log('5️⃣ 检查数据库表...');
    return prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
  })
  .then((tables) => {
    console.log('✅ 数据库表:');
    tables.forEach(t => console.log('  -', t.table_name));
    console.log('');
  })
  .catch((error) => {
    console.error('❌ 错误:', error.message);
    console.error('错误详情:', error);
  })
  .finally(() => {
    return prisma.$disconnect();
  });
