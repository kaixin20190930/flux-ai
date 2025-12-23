#!/bin/bash

echo "=========================================="
echo "测试生产环境"
echo "=========================================="
echo ""

WORKER_URL="https://flux-ai-worker-prod.liukai19911010.workers.dev"

echo "🔍 生产环境信息"
echo "   Worker URL: $WORKER_URL"
echo "   数据库: flux-ai"
echo ""

# 1. 健康检查
echo "1️⃣  测试健康检查..."
curl -s "$WORKER_URL/" | jq '.'
echo ""
echo ""

# 2. 测试注册
echo "2️⃣  测试邮箱注册..."
REGISTER_RESPONSE=$(curl -s -X POST "$WORKER_URL/auth/register" \
  -H "Content-Type: application/json" \
  -H "Origin: https://flux-ai-img.com" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123456"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# 提取 token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')

if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
  echo "✅ 注册成功！"
  echo "   User ID: $USER_ID"
  echo "   Token: ${TOKEN:0:50}..."
else
  echo "⚠️  注册失败或用户已存在"
fi
echo ""
echo ""

# 3. 测试登录
echo "3️⃣  测试邮箱登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$WORKER_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "Origin: https://flux-ai-img.com" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
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

# 4. 测试错误密码
echo "4️⃣  测试错误密码..."
WRONG_PASSWORD_RESPONSE=$(curl -s -X POST "$WORKER_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "Origin: https://flux-ai-img.com" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword"
  }')

echo "$WRONG_PASSWORD_RESPONSE"
echo ""

if echo "$WRONG_PASSWORD_RESPONSE" | grep -q "Invalid credentials"; then
  echo "✅ 错误密码被正确拒绝"
else
  echo "❌ 错误密码验证失败"
fi
echo ""
echo ""

echo "=========================================="
echo "测试完成！"
echo "=========================================="
