#!/bin/bash

# 运行 Prisma 迁移脚本
# 用法: ./scripts/run-migration.sh

set -e

# 加载环境变量
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

echo "🔄 开始数据库迁移..."
echo "📊 数据库: $DATABASE_URL"
echo ""

# 运行迁移
npx prisma migrate dev --name add_transactions_and_stats

# 生成 Prisma Client
echo ""
echo "🔄 生成 Prisma Client..."
npx prisma generate

echo ""
echo "✅ 迁移完成！"
