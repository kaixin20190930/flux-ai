#!/bin/bash

echo "🔧 完整修复注册问题..."
echo ""

# 1. 停止所有可能的进程
echo "1️⃣ 停止所有相关进程..."
pkill -f "next dev" || true
pkill -f "wrangler" || true
sleep 2
echo "✅ 进程已停止"
echo ""

# 2. 清理所有缓存
echo "2️⃣ 清理缓存..."
rm -rf .next
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
rm -rf node_modules/.cache
echo "✅ 缓存已清理"
echo ""

# 3. 重新生成 Prisma Client
echo "3️⃣ 重新生成 Prisma Client..."
npx prisma generate
echo "✅ Prisma Client 已生成"
echo ""

# 4. 验证环境变量
echo "4️⃣ 验证环境变量..."
if [ ! -f .env.local ]; then
    echo "❌ .env.local 文件不存在！"
    exit 1
fi

if ! grep -q "DATABASE_URL" .env.local; then
    echo "❌ .env.local 中没有 DATABASE_URL！"
    exit 1
fi

echo "✅ 环境变量文件存在"
echo ""

echo "✅ 修复完成！"
echo ""
echo "现在请："
echo "1. 启动开发服务器: npm run dev"
echo "2. 访问: http://localhost:3000/api/debug/env"
echo "3. 检查环境变量是否正确加载"
echo "4. 尝试注册新用户"
