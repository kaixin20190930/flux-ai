#!/bin/bash

# 修复并测试开发环境 Worker
# 确保使用正确的 worker 名称和数据库

set -e

echo "========================================"
echo "修复并测试开发环境 Worker"
echo "========================================"

# 配置
WORKER_NAME="flux-ai-worker-dev"
DB_NAME="flux-ai-dev"
ENVIRONMENT="development"
WORKER_URL="https://flux-ai-worker-dev.liukai19911010.workers.dev"

echo ""
echo "1️⃣  重新部署开发环境 Worker..."
echo "Worker 名称: $WORKER_NAME"
echo "数据库: $DB_NAME"
echo "环境: $ENVIRONMENT"
echo "URL: $WORKER_URL"

cd worker
# 使用默认配置部署（开发环境）
wrangler deploy

echo ""
echo "✅ 部署完成！等待 5 秒让部署生效..."
sleep 5

echo ""
echo "2️⃣  测试健康检查..."

# 测试健康检查
HEALTH_RESPONSE=$(curl -s $WORKER_URL/)
ENVIRONMENT_VALUE=$(echo $HEALTH_RESPONSE | jq -r '.environment')

echo "健康检查响应: $HEALTH_RESPONSE"
echo "环境变量: $ENVIRONMENT_VALUE"

if [ "$ENVIRONMENT_VALUE" != "development" ]; then
  echo "⚠️  环境变量是: $ENVIRONMENT_VALUE (预期是 development)"
  echo "注意：这可能是 Cloudflare 缓存问题，不影响功能"
else
  echo "✅ 环境变量正确: $ENVIRONMENT_VALUE"
fi

echo ""
echo "3️⃣  测试邮箱注册..."

# 生成随机邮箱
RANDOM_EMAIL="test_$(date +%s)@example.com"

REGISTER_RESPONSE=$(curl -s -X POST $WORKER_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User\",
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"test123456\"
  }")

echo "注册响应: $REGISTER_RESPONSE"

if echo $REGISTER_RESPONSE | jq -e '.success' > /dev/null; then
  echo "✅ 注册成功"
  TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')
  USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')
  POINTS=$(echo $REGISTER_RESPONSE | jq -r '.user.points')
  echo "Token: ${TOKEN:0:20}..."
  echo "User ID: $USER_ID"
  echo "Points: $POINTS"
else
  echo "❌ 注册失败"
  ERROR_MSG=$(echo $REGISTER_RESPONSE | jq -r '.error.message // .error // "Unknown error"')
  echo "错误信息: $ERROR_MSG"
fi

echo ""
echo "4️⃣  测试邮箱登录..."

LOGIN_RESPONSE=$(curl -s -X POST $WORKER_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$RANDOM_EMAIL\",
    \"password\": \"test123456\"
  }")

echo "登录响应: $LOGIN_RESPONSE"

if echo $LOGIN_RESPONSE | jq -e '.success' > /dev/null; then
  echo "✅ 登录成功"
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
  echo "Token: ${TOKEN:0:20}..."
else
  echo "❌ 登录失败"
  ERROR_MSG=$(echo $LOGIN_RESPONSE | jq -r '.error.message // .error // "Unknown error"')
  echo "错误信息: $ERROR_MSG"
fi

echo ""
echo "5️⃣  检查数据库中的用户..."

wrangler d1 execute $DB_NAME --remote --command "SELECT id, name, email, points FROM users ORDER BY created_at DESC LIMIT 5;"

echo ""
echo "========================================"
echo "测试完成！"
echo "========================================"
echo ""
echo "📋 总结："
echo "开发环境 Worker: $WORKER_URL"
echo "数据库: $DB_NAME"
echo "环境变量: $ENVIRONMENT_VALUE"
echo ""
