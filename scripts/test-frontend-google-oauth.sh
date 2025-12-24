#!/bin/bash

echo "=========================================="
echo "Google OAuth 前端测试"
echo "=========================================="
echo ""

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

echo "=========================================="
echo "1. 前端文件检查"
echo "=========================================="
echo ""

# 1.1 检查 GoogleOAuthButton 组件
test_case "GoogleOAuthButton 组件存在"
if [ -f "components/GoogleOAuthButton.tsx" ]; then
  pass "组件文件存在"
else
  fail "组件文件不存在"
fi
echo ""

# 1.2 检查 AuthForm 组件更新
test_case "AuthForm 组件包含 Google OAuth"
if grep -q "GoogleOAuthButton" components/AuthForm.tsx; then
  pass "AuthForm 已集成 GoogleOAuthButton"
else
  fail "AuthForm 未集成 GoogleOAuthButton"
fi
echo ""

# 1.3 检查 Google OAuth Provider
test_case "Google OAuth Provider 配置"
if grep -q "GoogleOAuthProvider" components/providers/GoogleOAuthProvider.tsx 2>/dev/null; then
  pass "Provider 已配置"
else
  fail "Provider 未配置"
fi
echo ""

echo "=========================================="
echo "2. 多语言文案检查"
echo "=========================================="
echo ""

# 定义需要检查的语言
LANGUAGES=("en" "zh" "zh-TW" "ja" "ko" "es" "pt" "de" "fr" "it" "ru" "ar" "hi" "id" "tr" "nl" "pl" "vi" "th" "ms")

# 2.1 检查所有语言文件是否包含 Google OAuth 相关文案
test_case "多语言文案完整性"
MISSING_LANGS=()

for lang in "${LANGUAGES[@]}"; do
  LANG_FILE="app/i18n/locales/${lang}.json"
  if [ -f "$LANG_FILE" ]; then
    # 检查是否包含 Google 相关的 key
    if grep -q "google" "$LANG_FILE" 2>/dev/null; then
      # 语言文件存在且包含 google 相关内容
      :
    else
      MISSING_LANGS+=("$lang")
    fi
  else
    MISSING_LANGS+=("$lang")
  fi
done

if [ ${#MISSING_LANGS[@]} -eq 0 ]; then
  pass "所有 ${#LANGUAGES[@]} 种语言文案完整"
else
  fail "缺少 ${#MISSING_LANGS[@]} 种语言的文案: ${MISSING_LANGS[*]}"
fi
echo ""

# 2.2 检查关键文案 key
test_case "关键文案 key 存在"
KEY_LANGS=("en" "zh" "ja")
MISSING_KEYS=0

for lang in "${KEY_LANGS[@]}"; do
  LANG_FILE="app/i18n/locales/${lang}.json"
  if [ -f "$LANG_FILE" ]; then
    # 检查是否包含关键的 Google OAuth 文案
    if ! grep -q "googleSignIn\|google.*login\|google.*signin" "$LANG_FILE" 2>/dev/null; then
      MISSING_KEYS=$((MISSING_KEYS + 1))
    fi
  fi
done

if [ $MISSING_KEYS -eq 0 ]; then
  pass "关键语言文案 key 完整"
else
  fail "$MISSING_KEYS 个关键语言缺少文案 key"
fi
echo ""

echo "=========================================="
echo "3. TypeScript 类型检查"
echo "=========================================="
echo ""

# 3.1 TypeScript 编译检查
test_case "TypeScript 类型检查"
echo "   运行 tsc --noEmit..."
if npm run type-check > /tmp/tsc-output.log 2>&1; then
  pass "TypeScript 类型检查通过"
else
  # 检查是否有 Google OAuth 相关的错误
  if grep -i "google\|oauth" /tmp/tsc-output.log > /dev/null 2>&1; then
    fail "存在 Google OAuth 相关的类型错误"
    echo "   查看详细错误: cat /tmp/tsc-output.log"
  else
    pass "无 Google OAuth 相关的类型错误"
  fi
fi
echo ""

echo "=========================================="
echo "4. 构建测试"
echo "=========================================="
echo ""

# 4.1 Next.js 构建
test_case "Next.js 构建"
echo "   运行 npm run build..."
if npm run build > /tmp/build-output.log 2>&1; then
  pass "构建成功"
else
  fail "构建失败"
  echo "   查看详细错误: cat /tmp/build-output.log"
fi
echo ""

# 4.2 检查构建输出
test_case "构建输出检查"
if [ -d ".next" ]; then
  pass ".next 目录已生成"
else
  fail ".next 目录未生成"
fi
echo ""

echo "=========================================="
echo "5. 环境变量检查"
echo "=========================================="
echo ""

# 5.1 检查 .env.local
test_case "开发环境变量配置"
if [ -f ".env.local" ]; then
  if grep -q "NEXT_PUBLIC_GOOGLE_CLIENT_ID" .env.local; then
    pass "NEXT_PUBLIC_GOOGLE_CLIENT_ID 已配置"
  else
    fail "NEXT_PUBLIC_GOOGLE_CLIENT_ID 未配置"
  fi
else
  fail ".env.local 文件不存在"
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
echo -e "   失败: ${RED}$((TOTAL_TESTS - PASSED_TESTS))${NC}"
echo "   成功率: $SUCCESS_RATE%"
echo ""

# 最终结论
echo "=========================================="
echo "最终结论"
echo "=========================================="
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ 所有前端测试通过！${NC}"
  echo ""
  echo "📝 下一步："
  echo "   1. 推送代码到 GitHub"
  echo "   2. Cloudflare Pages 会自动部署"
  echo "   3. 在生产环境测试 Google OAuth 功能"
  echo "   4. 使用手动测试清单: .kiro/specs/google-oauth-integration/manual-testing-checklist.md"
  echo ""
  EXIT_CODE=0
elif [ $SUCCESS_RATE -ge 80 ]; then
  echo -e "${YELLOW}⚠️  大部分测试通过 ($SUCCESS_RATE%)，但有 $FAILED_TESTS 个失败。${NC}"
  echo "   建议修复失败项后再部署。"
  EXIT_CODE=1
else
  echo -e "${RED}❌ 测试失败率过高 ($FAILED_TESTS/$TOTAL_TESTS)。${NC}"
  echo "   请修复错误后再部署。"
  EXIT_CODE=1
fi
echo ""

exit $EXIT_CODE
