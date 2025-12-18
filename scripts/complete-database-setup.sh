#!/bin/bash

# 完整的数据库设置脚本 - 一键完成所有步骤

set -e

echo "🎯 PostgreSQL 完整设置向导"
echo "================================"
echo ""

# 步骤 1: 设置数据库
echo "📦 步骤 1/4: 安装并配置 PostgreSQL..."
bash scripts/setup-database.sh

echo ""
echo "================================"
echo ""

# 步骤 2: 更新环境变量
echo "📝 步骤 2/4: 更新 .env.local 配置..."
node scripts/update-database-url.js

echo ""
echo "================================"
echo ""

# 步骤 3: 运行 Prisma 迁移
echo "🔄 步骤 3/4: 运行数据库迁移..."
npx prisma migrate dev --name init

echo ""
echo "================================"
echo ""

# 步骤 4: 验证数据库
echo "✅ 步骤 4/4: 验证数据库设置..."
npx prisma db pull --force

echo ""
echo "================================"
echo ""
echo "🎉 数据库设置完成！"
echo ""
echo "现在你可以："
echo "1. 重启开发服务器: npm run dev"
echo "2. 测试登录功能"
echo ""
