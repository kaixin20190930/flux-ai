#!/bin/bash

# 数据库备份脚本
# 用法: ./scripts/backup-database.sh

set -e

# 创建备份目录
mkdir -p backups

# 获取当前时间戳
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔄 开始备份数据库..."

# 备份 Neon PostgreSQL
echo "📦 备份 Neon PostgreSQL..."
if [ -n "$DATABASE_URL" ]; then
    pg_dump "$DATABASE_URL" > "backups/neon_backup_${TIMESTAMP}.sql"
    echo "✅ Neon 备份完成: backups/neon_backup_${TIMESTAMP}.sql"
else
    echo "⚠️  警告: DATABASE_URL 未设置，跳过 Neon 备份"
fi

# 备份 Cloudflare D1（如果有）
echo "📦 尝试备份 Cloudflare D1..."
if command -v wrangler &> /dev/null; then
    if wrangler d1 list 2>/dev/null | grep -q "flux-ai-db"; then
        wrangler d1 export flux-ai-db --output="backups/d1_backup_${TIMESTAMP}.sql"
        echo "✅ D1 备份完成: backups/d1_backup_${TIMESTAMP}.sql"
    else
        echo "⚠️  警告: 未找到 flux-ai-db 数据库"
    fi
else
    echo "⚠️  警告: wrangler 未安装，跳过 D1 备份"
fi

echo ""
echo "✅ 备份完成！"
echo "📁 备份文件位于 backups/ 目录"
ls -lh backups/ | tail -n +2
