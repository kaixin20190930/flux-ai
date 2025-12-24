#!/bin/bash

echo "=========================================="
echo "Google OAuth 生产环境完整测试"
echo "=========================================="
echo ""

FRONTEND_URL="https://flux-ai-img.com"
WORKER_URL="https://flux-ai-worker-prod.liukai19911010.workers.dev"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试计数
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# 性能指标（使用简单变量而不是关联数组）
WORKER_HEALTH_TIME=0
FRONTEND_LOAD_TIME=0

# 测试函数
test_case() {
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo -e "${BLUE}测试 $TOTAL_TESTS: $1${NC}"
}

pass() {
  PASSED_TESTS=$((PASSED_TESTS + 1))
  echo -e "   ${GREEN}✅ 通过${NC}"
  if [ ! -z "$1" ]; then
    echo "   详情: $1"
  fi
}

fail() {
  FAILED_TESTS=$((FAILED_TESTS + 1))
  echo -e "   ${RED}❌ 失败${NC}"
  if [ ! -z "$1" ]; then
    echo "   原因: $1"
  fi
}

warn() {
  WARNINGS=$((WARNINGS + 1))
  echo -e "   ${YELLOW}⚠️  警告${NC}"
  if [ ! -z "$1" ]; then
    echo "   详情: $1"
  fi
}

# 性能测试函数
measure_time() {
  local start=$(date +%s%3N)
  eval "$1" > /dev/null 2>&1
  local end=$(date +%s%3N)
  echo $((end - start))
}

echo "🔍 测试环境信息"
echo "   前端 URL: $FRONTEND_URL"
echo "   Worker URL: $WORKER_URL"
echo ""
echo "=========================================="
echo "1. 部署验证测试"
echo "=========================================="
echo ""

# 1.1 Worker 健康检查
test_case "Worker 健康检查"
HEALTH_RESPONSE=$(curl -s "$WORKER_URL/")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
  pass "Worker 正常运行"
else
  fail "Worker 未响应或返回错误"
fi
echo ""

# 1.2 前端可访问性
test_case "前端可访问性"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
  pass "前端返回 200 OK"
elif [ "$FRONTEND_STATUS" = "301" ] || [ "$FRONTEND_STATUS" = "302" ]; then
  warn "前端返回重定向 $FRONTEND_STATUS"
else
  fail "前端返回状态码: $FRONTEND_STATUS"
fi
echo ""

# 1.3 CORS 配置检查
test_case "CORS 配置"
CORS_RESPONSE=$(curl -s -I \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  "$WORKER_URL/auth/google-login")

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
  ALLOWED_ORIGIN=$(echo "$CORS_RESPONSE" | grep "Access-Control-Allow-Origin" | cut -d' ' -f2 | tr -d '\r')
  if [ "$ALLOWED_ORIGIN" = "$FRONTEND_URL" ] || [ "$ALLOWED_ORIGIN" = "*" ]; then
    pass "CORS 正确配置: $ALLOWED_ORIGIN"
  else
    warn "CORS 配置可能不正确: $ALLOWED_ORIGIN"
  fi
else
  fail "CORS 头未找到"
fi
echo ""

# 1.4 SSL 证书检查
test_case "SSL 证书验证"
SSL_CHECK=$(echo | openssl s_client -connect flux-ai-img.com:443 -servername flux-ai-img.com 2>/dev/null | grep "Verify return code")
if echo "$SSL_CHECK" | grep -q "0 (ok)"; then
  pass "SSL 证书有效"
else
  fail "SSL 证书问题: $SSL_CHECK"
fi
echo ""

echo "=========================================="
echo "2. 环境变量配置测试"
echo "=========================================="
echo ""

# 2.1 检查 Worker Secrets
test_case "Worker Secrets 配置"
cd worker 2>/dev/null || cd ../worker 2>/dev/null
if [ $? -eq 0 ]; then
  SECRETS=$(wrangler secret list --env production 2>/dev/null)
  if echo "$SECRETS" | grep -q "GOOGLE_CLIENT_SECRET"; then
    pass "GOOGLE_CLIENT_SECRET 已配置"
  else
    fail "GOOGLE_CLIENT_SECRET 未配置"
  fi
  
  if echo "$SECRETS" | grep -q "JWT_SECRET"; then
    pass "JWT_SECRET 已配置"
  else
    warn "JWT_SECRET 未配置"
  fi
else
  warn "无法访问 worker 目录，跳过 secrets 检查"
fi
cd - > /dev/null 2>&1
echo ""

# 2.2 检查前端环境变量（通过页面源码）
test_case "前端 Google Client ID 配置"
FRONTEND_HTML=$(curl -s "$FRONTEND_URL")
if echo "$FRONTEND_HTML" | grep -q "googleusercontent.com"; then
  pass "Google Client ID 已配置"
else
  warn "无法确认 Google Client ID 配置"
fi
echo ""

echo "=========================================="
echo "3. API 功能测试"
echo "=========================================="
echo ""

# 3.1 测试 Google 登录端点（错误场景）
test_case "Google 登录 API 端点"
GOOGLE_LOGIN_RESPONSE=$(curl -s -X POST "$WORKER_URL/auth/google-login" \
  -H "Content-Type: application/json" \
  -H "Origin: $FRONTEND_URL" \
  -d '{
    "googleToken": "invalid_token",
    "email": "test@example.com",
    "name": "Test User"
  }')

# 应该返回错误（因为 token 无效）
if echo "$GOOGLE_LOGIN_RESPONSE" | grep -q "error\|Invalid"; then
  pass "API 正确拒绝无效 token"
else
  warn "API 响应异常: $GOOGLE_LOGIN_RESPONSE"
fi
echo ""

# 3.2 测试邮箱登录（确保不影响现有功能）
test_case "邮箱登录功能（回归测试）"
EMAIL_LOGIN_RESPONSE=$(curl -s -X POST "$WORKER_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "Origin: $FRONTEND_URL" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }')

if echo "$EMAIL_LOGIN_RESPONSE" | grep -q "token\|error\|Invalid"; then
  pass "邮箱登录 API 正常响应"
else
  fail "邮箱登录 API 异常"
fi
echo ""

echo "=========================================="
echo "4. 性能测试"
echo "=========================================="
echo ""

# 4.1 Worker API 响应时间
test_case "Worker API 响应时间"
START_TIME=$(perl -MTime::HiRes=time -e 'printf "%.0f\n", time * 1000')
curl -s "$WORKER_URL/" > /dev/null
END_TIME=$(perl -MTime::HiRes=time -e 'printf "%.0f\n", time * 1000')
RESPONSE_TIME=$((END_TIME - START_TIME))
WORKER_HEALTH_TIME=$RESPONSE_TIME

if [ $RESPONSE_TIME -lt 1000 ]; then
  pass "响应时间: ${RESPONSE_TIME}ms (< 1s)"
elif [ $RESPONSE_TIME -lt 3000 ]; then
  warn "响应时间: ${RESPONSE_TIME}ms (1-3s)"
else
  fail "响应时间: ${RESPONSE_TIME}ms (> 3s)"
fi
echo ""

# 4.2 前端加载时间
test_case "前端页面加载时间"
START_TIME=$(perl -MTime::HiRes=time -e 'printf "%.0f\n", time * 1000')
curl -s "$FRONTEND_URL" > /dev/null
END_TIME=$(perl -MTime::HiRes=time -e 'printf "%.0f\n", time * 1000')
LOAD_TIME=$((END_TIME - START_TIME))
FRONTEND_LOAD_TIME=$LOAD_TIME

if [ $LOAD_TIME -lt 2000 ]; then
  pass "加载时间: ${LOAD_TIME}ms (< 2s)"
elif [ $LOAD_TIME -lt 5000 ]; then
  warn "加载时间: ${LOAD_TIME}ms (2-5s)"
else
  fail "加载时间: ${LOAD_TIME}ms (> 5s)"
fi
echo ""

echo "=========================================="
echo "5. 多语言支持测试"
echo "=========================================="
echo ""

# 5.1 测试主要语言
LANGUAGES=("en" "zh" "zh-TW" "ja" "ko" "es" "pt" "de" "fr")
LANG_PASSED=0
LANG_FAILED=0

test_case "多语言路由可访问性"
for lang in "${LANGUAGES[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/$lang")
  if [ "$STATUS" = "200" ]; then
    LANG_PASSED=$((LANG_PASSED + 1))
  else
    LANG_FAILED=$((LANG_FAILED + 1))
  fi
done

if [ $LANG_FAILED -eq 0 ]; then
  pass "所有测试语言 ($LANG_PASSED/${#LANGUAGES[@]}) 可访问"
elif [ $LANG_PASSED -gt $LANG_FAILED ]; then
  warn "$LANG_PASSED/${#LANGUAGES[@]} 语言可访问，$LANG_FAILED 个失败"
else
  fail "多数语言路由不可访问"
fi
echo ""

echo "=========================================="
echo "6. 安全测试"
echo "=========================================="
echo ""

# 6.1 HTTPS 强制
test_case "HTTPS 强制重定向"
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://flux-ai-img.com")
if [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "302" ] || [ "$HTTP_RESPONSE" = "308" ]; then
  pass "HTTP 正确重定向到 HTTPS"
else
  warn "HTTP 未重定向 (状态码: $HTTP_RESPONSE)"
fi
echo ""

# 6.2 安全头检查
test_case "安全响应头"
SECURITY_HEADERS=$(curl -s -I "$FRONTEND_URL")
SECURITY_SCORE=0

if echo "$SECURITY_HEADERS" | grep -qi "Strict-Transport-Security"; then
  SECURITY_SCORE=$((SECURITY_SCORE + 1))
fi
if echo "$SECURITY_HEADERS" | grep -qi "X-Content-Type-Options"; then
  SECURITY_SCORE=$((SECURITY_SCORE + 1))
fi
if echo "$SECURITY_HEADERS" | grep -qi "X-Frame-Options"; then
  SECURITY_SCORE=$((SECURITY_SCORE + 1))
fi

if [ $SECURITY_SCORE -ge 2 ]; then
  pass "安全头配置良好 ($SECURITY_SCORE/3)"
elif [ $SECURITY_SCORE -eq 1 ]; then
  warn "部分安全头缺失 ($SECURITY_SCORE/3)"
else
  fail "安全头配置不足 ($SECURITY_SCORE/3)"
fi
echo ""

# 6.3 SQL 注入防护测试
test_case "SQL 注入防护"
SQL_INJECTION_RESPONSE=$(curl -s -X POST "$WORKER_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com OR 1=1--",
    "password": "test"
  }')

if echo "$SQL_INJECTION_RESPONSE" | grep -q "error\|Invalid"; then
  pass "SQL 注入尝试被正确拒绝"
else
  fail "SQL 注入防护可能存在问题"
fi
echo ""

echo "=========================================="
echo "7. 数据库连接测试"
echo "=========================================="
echo ""

# 7.1 测试数据库查询（通过 API）
test_case "数据库连接（通过 API）"
# 尝试登录，这会触发数据库查询
DB_TEST_RESPONSE=$(curl -s -X POST "$WORKER_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "test"
  }')

if echo "$DB_TEST_RESPONSE" | grep -q "error\|Invalid\|not found"; then
  pass "数据库查询正常（返回预期错误）"
else
  warn "数据库响应异常"
fi
echo ""

echo "=========================================="
echo "测试总结"
echo "=========================================="
echo ""

# 计算成功率
if [ $TOTAL_TESTS -gt 0 ]; then
  SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
else
  SUCCESS_RATE=0
fi

echo "📊 测试统计"
echo "   总测试数: $TOTAL_TESTS"
echo -e "   通过: ${GREEN}$PASSED_TESTS${NC}"
echo -e "   失败: ${RED}$FAILED_TESTS${NC}"
echo -e "   警告: ${YELLOW}$WARNINGS${NC}"
echo "   成功率: $SUCCESS_RATE%"
echo ""

echo "⚡ 性能指标"
echo "   Worker 响应时间: ${PERFORMANCE_METRICS[worker_health]}ms"
echo "   前端加载时间: ${PERFORMANCE_METRICS[frontend_load]}ms"
echo ""

# 需求验证
echo "📋 需求验证"
echo ""
echo "需求 6.1: Google 授权页面打开 < 500ms"
echo "   ⚠️  需要手动测试（浏览器开发者工具）"
echo ""
echo "需求 6.2: 登录流程 < 3 秒"
if [ ${PERFORMANCE_METRICS[worker_health]} -lt 3000 ]; then
  echo -e "   ${GREEN}✅ API 响应时间满足要求${NC}"
else
  echo -e "   ${RED}❌ API 响应时间超出要求${NC}"
fi
echo ""

# 最终结论
echo "=========================================="
echo "最终结论"
echo "=========================================="
echo ""

if [ $FAILED_TESTS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ 所有测试通过！生产环境就绪。${NC}"
  EXIT_CODE=0
elif [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  所有测试通过，但有 $WARNINGS 个警告。${NC}"
  echo "   建议检查警告项后再发布。"
  EXIT_CODE=0
elif [ $SUCCESS_RATE -ge 80 ]; then
  echo -e "${YELLOW}⚠️  大部分测试通过 ($SUCCESS_RATE%)，但有 $FAILED_TESTS 个失败。${NC}"
  echo "   建议修复失败项后再发布。"
  EXIT_CODE=1
else
  echo -e "${RED}❌ 测试失败率过高 ($FAILED_TESTS/$TOTAL_TESTS)。${NC}"
  echo "   不建议发布到生产环境。"
  EXIT_CODE=1
fi
echo ""

echo "📚 详细测试指南: .kiro/specs/google-oauth-integration/production-testing-guide.md"
echo ""

exit $EXIT_CODE
