#!/bin/bash

echo "🔧 修复数据库连接问题..."
echo ""

# 1. 检查环境变量文件
echo "1️⃣ 检查环境变量文件..."
if [ ! -f .env.local ]; then
    echo "❌ .env.local 文件不存在"
    exit 1
fi

if ! grep -q "DATABASE_URL" .env.local; then
    echo "❌ .env.local 中没有 DATABASE_URL"
    exit 1
fi

echo "✅ 环境变量文件存在"
echo ""

# 2. 清理 Prisma 缓存
echo "2️⃣ 清理 Prisma 缓存..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
echo "✅ Prisma 缓存已清理"
echo ""

# 3. 重新生成 Prisma Client
echo "3️⃣ 重新生成 Prisma Client..."
npx prisma generate
echo "✅ Prisma Client 已重新生成"
echo ""

# 4. 清理 Next.js 缓存
echo "4️⃣ 清理 Next.js 缓存..."
rm -rf .next
echo "✅ Next.js 缓存已清理"
echo ""

# 5. 测试数据库连接
echo "5️⃣ 测试数据库连接..."
node scripts/test-db-connection.js
if [ $? -ne 0 ]; then
    echo "❌ 数据库连接测试失败"
    exit 1
fi
echo ""

# 6. 测试数据库权限
echo "6️⃣ 测试数据库权限..."
node scripts/test-neon-permissions.js
if [ $? -ne 0 ]; then
    echo "❌ 数据库权限测试失败"
    exit 1
fi
echo ""

echo "✅ 所有修复完成！"
echo ""
echo "现在请重启开发服务器："
echo "  npm run dev"
