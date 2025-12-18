const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testDatabasePermissions() {
  console.log('🔍 测试 Neon 数据库权限...\n');

  try {
    // 1. 测试连接
    console.log('1️⃣ 测试数据库连接...');
    await prisma.$connect();
    console.log('✅ 数据库连接成功\n');

    // 2. 测试读取权限
    console.log('2️⃣ 测试读取权限...');
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ 读取权限正常 (找到 ${userCount} 个用户)\n`);
    } catch (error) {
      console.error('❌ 读取权限失败:', error.message);
      console.error('详细错误:', error);
      throw error;
    }

    // 3. 测试写入权限
    console.log('3️⃣ 测试写入权限...');
    try {
      const testEmail = `test_${Date.now()}@example.com`;
      const testUser = await prisma.user.create({
        data: {
          email: testEmail,
          name: 'Test User',
          points: 50,
        },
      });
      console.log(`✅ 写入权限正常 (创建了测试用户: ${testUser.email})\n`);

      // 清理测试数据
      await prisma.user.delete({
        where: { id: testUser.id },
      });
      console.log('✅ 删除权限正常 (已清理测试数据)\n');
    } catch (error) {
      console.error('❌ 写入权限失败:', error.message);
      console.error('详细错误:', error);
      throw error;
    }

    // 4. 测试查询特定用户
    console.log('4️⃣ 测试查询特定用户...');
    try {
      const user = await prisma.user.findFirst();
      if (user) {
        console.log(`✅ 查询权限正常 (找到用户: ${user.email})\n`);
      } else {
        console.log('⚠️  数据库中没有用户\n');
      }
    } catch (error) {
      console.error('❌ 查询权限失败:', error.message);
      console.error('详细错误:', error);
      throw error;
    }

    console.log('✅ 所有权限测试通过！');
  } catch (error) {
    console.error('\n❌ 数据库权限测试失败');
    console.error('错误详情:', error);
    
    // 提供解决方案
    console.log('\n🔧 可能的解决方案:');
    console.log('1. 检查 DATABASE_URL 是否正确');
    console.log('2. 确认 Neon 数据库用户有正确的权限');
    console.log('3. 运行 Prisma 迁移: npx prisma migrate deploy');
    console.log('4. 重新生成 Prisma Client: npx prisma generate');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabasePermissions();
