#!/bin/bash

echo "🔧 修复注册后的问题..."

# 1. 清理 Next.js 缓存
echo "📦 清理 Next.js 缓存..."
rm -rf .next
rm -rf .next/cache

# 2. 清理 node_modules 缓存（可选）
echo "🧹 清理 node_modules 缓存..."
rm -rf node_modules/.cache

# 3. 重新生成 Prisma Client
echo "🔄 重新生成 Prisma Client..."
npx prisma generate

echo "✅ 修复完成！"
echo ""
echo "现在请重启开发服务器："
echo "  npm run dev"
