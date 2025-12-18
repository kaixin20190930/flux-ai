#!/bin/bash

# 本地 Worker 测试脚本
# 用于快速验证 Worker 是否正常工作

echo "🧪 开始测试本地 Worker..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

WORKER_URL="http://localhost:8787"

# 测试 1: 健康检查
echo "📋 测试 1: 健康检查"
response=$(curl -s -w "\n%{http_code}" "$WORKER_URL/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ 健康检查通过${NC}"
    echo "响应: $body"
else
    echo -e "${RED}❌ 健康检查失败 (HTTP $http_code)${NC}"
    echo "响应: $body"
    exit 1
fi
echo ""

# 测试 2: 注册新用户
echo "📋 测试 2: 注册新用户"
timestamp=$(date +%s)
test_email="test-$timestamp@example.com"

response=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"$test_email\",\"password\":\"test123456\"}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ 注册成功${NC}"
    echo "邮箱: $test_email"
    
    # 提取 token
    token=$(echo "$body" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$token" ]; then
        echo "Token: ${token:0:20}..."
    fi
else
    echo -e "${RED}❌ 注册失败 (HTTP $http_code)${NC}"
    echo "响应: $body"
    exit 1
fi
echo ""

# 测试 3: 登录
echo "📋 测试 3: 登录"
response=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$test_email\",\"password\":\"test123456\"}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ 登录成功${NC}"
    
    # 提取 token
    token=$(echo "$body" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$token" ]; then
        echo "Token: ${token:0:20}..."
    fi
else
    echo -e "${RED}❌ 登录失败 (HTTP $http_code)${NC}"
    echo "响应: $body"
    exit 1
fi
echo ""

# 测试 4: 验证 Token
echo "📋 测试 4: 验证 Token"
response=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_URL/auth/verify-token" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Token 验证成功${NC}"
    echo "响应: $body"
else
    echo -e "${RED}❌ Token 验证失败 (HTTP $http_code)${NC}"
    echo "响应: $body"
    exit 1
fi
echo ""

# 测试 5: 获取积分余额
echo "📋 测试 5: 获取积分余额"
response=$(curl -s -w "\n%{http_code}" -X GET "$WORKER_URL/points/balance" \
  -H "Authorization: Bearer $token")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ 获取积分成功${NC}"
    echo "响应: $body"
else
    echo -e "${RED}❌ 获取积分失败 (HTTP $http_code)${NC}"
    echo "响应: $body"
    exit 1
fi
echo ""

# 总结
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 所有测试通过！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "测试账号信息："
echo "  邮箱: $test_email"
echo "  密码: test123456"
echo "  Token: ${token:0:30}..."
echo ""
echo "下一步："
echo "  1. 打开浏览器访问 http://localhost:3000"
echo "  2. 清除浏览器数据（F12 → Application → Clear site data）"
echo "  3. 使用上面的测试账号登录"
echo "  4. 测试图片生成功能"
echo ""
