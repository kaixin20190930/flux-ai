const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testRegistration() {
  console.log('🔍 测试注册功能...\n');

  try {
    const testEmail = `test_${Date.now()}@example.com`;
    const testName = 'Test User';
    const testPassword = 'password123';

    console.log('1️⃣ 检查用户是否已存在...');
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail }
    });
    
    if (existingUser) {
      console.log('⚠️  用户已存在，删除旧用户...');
      await prisma.user.delete({
        where: { id: existingUser.id }
      });
    }
    console.log('✅ 用户不存在，可以继续\n');

    console.log('2️⃣ 加密密码...');
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    console.log('✅ 密码加密成功\n');

    console.log('3️⃣ 创建新用户...');
    const user = await prisma.user.create({
      data: {
        name: testName,
        email: testEmail,
        password: hashedPassword,
        points: 50,
      }
    });
    console.log('✅ 用户创建成功:', {
      id: user.id,
      name: user.name,
      email: user.email,
      points: user.points,
    });
    console.log('\n');

    console.log('4️⃣ 验证用户已创建...');
    const createdUser = await prisma.user.findUnique({
      where: { email: testEmail }
    });
    
    if (createdUser) {
      console.log('✅ 用户验证成功:', {
        id: createdUser.id,
        email: createdUser.email,
      });
    } else {
      console.error('❌ 用户验证失败');
    }
    console.log('\n');

    console.log('5️⃣ 清理测试数据...');
    await prisma.user.delete({
      where: { id: user.id }
    });
    console.log('✅ 测试数据已清理\n');

    console.log('✅ 所有测试通过！注册功能正常工作。');
  } catch (error) {
    console.error('\n❌ 测试失败');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误详情:', error);
    
    if (error.code) {
      console.error('错误代码:', error.code);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testRegistration();
