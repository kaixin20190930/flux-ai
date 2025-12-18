#!/bin/bash

# 修复生产环境问题
# Fix Production Issues

echo "🔧 Fixing production environment issues..."
echo "=========================================="
echo ""

cd worker

# 1. 修复数据库 schema
echo "1️⃣ Adding password_hash column to users table..."
wrangler d1 execute flux-ai --remote --file=../migrations/d1-add-password-hash.sql

echo ""
echo "2️⃣ Verifying users table schema..."
wrangler d1 execute flux-ai --remote --command "PRAGMA table_info(users);"

echo ""
echo "=========================================="
echo "✅ Database schema fixed!"
echo ""
echo "📝 Next steps:"
echo "   1. 在 Vercel 中设置环境变量："
echo "      NEXT_PUBLIC_WORKER_URL=https://api.flux-ai-img.com"
echo ""
echo "   2. 重新部署前端："
echo "      vercel --prod"
echo ""
echo "   3. 测试注册功能"
echo ""
