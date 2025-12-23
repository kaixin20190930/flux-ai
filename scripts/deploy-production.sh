#!/bin/bash

echo "=========================================="
echo "部署到生产环境"
echo "=========================================="
echo ""

cd worker

# 1. 初始化生产数据库
echo "1️⃣  初始化生产数据库..."
echo "   数据库: flux-ai"
echo "   使用新的 UUID 架构"
echo ""

wrangler d1 execute flux-ai --remote --file=../migrations/d1-auth-clean-simple.sql

echo ""
echo "✅ 数据库初始化完成！"
echo ""
echo ""

# 2. 验证表结构
echo "2️⃣  验证表结构..."
echo ""
echo "检查 users 表..."
wrangler d1 execute flux-ai --remote --command "PRAGMA table_info(users);"
echo ""

echo "检查 transactions 表..."
wrangler d1 execute flux-ai --remote --command "PRAGMA table_info(transactions);"
echo ""
echo ""

# 3. 部署 Worker 到生产环境
echo "3️⃣  部署 Worker 到生产环境..."
echo "   Worker: flux-ai-worker-prod"
echo "   数据库: flux-ai"
echo "   环境: production"
echo ""

wrangler deploy --env production

echo ""
echo "✅ Worker 部署完成！"
echo ""
echo "等待 5 秒让部署生效..."
sleep 5
echo ""
echo ""

# 4. 测试健康检查
echo "4️⃣  测试健康检查..."
HEALTH_RESPONSE=$(curl -s https://flux-ai-worker-prod.liukai19911010.workers.dev/)
echo "$HEALTH_RESPONSE" | jq '.'
echo ""

ENVIRONMENT=$(echo "$HEALTH_RESPONSE" | jq -r '.environment')
if [ "$ENVIRONMENT" = "production" ]; then
  echo "✅ 环境变量正确: production"
else
  echo "⚠️  环境变量: $ENVIRONMENT"
fi
echo ""
echo ""

# 5. 测试注册
echo "5️⃣  测试邮箱注册..."
REGISTER_RESPONSE=$(curl -s -X POST https://flux-ai-worker-prod.liukai19911010.workers.dev/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://flux-ai-img.com" \
  -d '{
    "name": "Production Test User",
    "email": "prodtest@example.com",
    "password": "ProdTest123456"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
echo ""

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')

if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
  echo "✅ 注册成功！"
  echo "   User ID: $USER_ID"
  echo "   Token: ${TOKEN:0:50}..."
else
  echo "❌ 注册失败"
  echo "   响应: $REGISTER_RESPONSE"
  echo ""
  echo "可能原因："
  echo "1. JWT_SECRET 未设置"
  echo "2. 数据库连接问题"
  echo ""
  echo "请检查 JWT_SECRET:"
  echo "   wrangler secret put JWT_SECRET --env production"
fi
echo ""
echo ""

# 6. 验证用户数据
echo "6️⃣  验证用户数据..."
wrangler d1 execute flux-ai --remote --command "SELECT id, name, email, points, created_at FROM users WHERE email = 'prodtest@example.com';"
echo ""
echo ""

# 7. 验证交易记录
echo "7️⃣  验证交易记录..."
wrangler d1 execute flux-ai --remote --command "SELECT id, user_id, type, amount, balance_before, balance_after, reason FROM transactions WHERE user_id = (SELECT id FROM users WHERE email = 'prodtest@example.com');"
echo ""
echo ""

# 8. 测试登录
echo "8️⃣  测试邮箱登录..."
LOGIN_RESPONSE=$(curl -s -X POST https://flux-ai-worker-prod.liukai19911010.workers.dev/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://flux-ai-img.com" \
  -d '{
    "email": "prodtest@example.com",
    "password": "ProdTest123456"
  }')

echo "$LOGIN_RESPONSE" | jq '.'
echo ""

LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
if [ "$LOGIN_TOKEN" != "null" ] && [ "$LOGIN_TOKEN" != "" ]; then
  echo "✅ 登录成功！"
  echo "   Token: ${LOGIN_TOKEN:0:50}..."
else
  echo "❌ 登录失败"
fi
echo ""
echo ""

# 9. 测试错误密码
echo "9️⃣  测试错误密码..."
WRONG_PASSWORD_RESPONSE=$(curl -s -X POST https://flux-ai-worker-prod.liukai19911010.workers.dev/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://flux-ai-img.com" \
  -d '{
    "email": "prodtest@example.com",
    "password": "WrongPassword"
  }')

echo "$WRONG_PASSWORD_RESPONSE"
echo ""

if echo "$WRONG_PASSWORD_RESPONSE" | grep -q "Invalid credentials"; then
  echo "✅ 错误密码被正确拒绝"
else
  echo "⚠️  错误密码验证异常"
fi
echo ""
echo ""

echo "=========================================="
echo "部署和测试完成！"
echo "=========================================="
echo ""
echo "📋 生产环境信息："
echo "   Worker URL: https://flux-ai-worker-prod.liukai19911010.workers.dev/"
echo "   数据库: flux-ai"
echo "   环境: $ENVIRONMENT"
echo ""
echo "🔍 查看实时日志："
echo "   cd worker && wrangler tail --env production"
echo ""
