#!/bin/bash

# 测试 Worker Token 验证
echo "🧪 测试 Worker Token 验证..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

WORKER_URL="http://localhost:8787"

# 从浏览器 localStorage 获取 token
echo "📋 请从浏览器控制台运行以下命令获取 token:"
echo ""
echo -e "${YELLOW}localStorage.getItem('auth_token')${NC}"
echo ""
echo "然后将 token 粘贴到下面:"
read -p "Token: " token

if [ -z "$token" ]; then
    echo -e "${RED}❌ 没有输入 token${NC}"
    exit 1
fi

echo ""
echo "🔍 Token 信息:"
echo "  长度: ${#token}"
echo "  前20字符: ${token:0:20}..."
echo ""

# 测试 Worker 验证
echo "📋 测试 Worker 验证..."
response=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_URL/auth/verify-token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "HTTP 状态: $http_code"
echo ""

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Worker 验证成功${NC}"
    echo ""
    echo "响应:"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ Worker 验证失败${NC}"
    echo ""
    echo "响应:"
    echo "$body"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
