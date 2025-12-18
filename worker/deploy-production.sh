#!/bin/bash

# Cloudflare 生产环境部署脚本

echo "🚀 Cloudflare Worker 生产环境部署"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查是否在 worker 目录
if [ ! -f "wrangler.toml" ]; then
    echo "❌ 错误：请在 worker 目录中运行此脚本"
    echo "   cd worker && ./deploy-production.sh"
    exit 1
fi

# 检查 wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ 错误：未找到 Wrangler"
    echo "   请先安装: npm install -g wrangler"
    exit 1
fi

# 检查登录状态
echo "🔐 检查 Cloudflare 登录状态..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ 未登录 Cloudflare"
    echo "   运行: wrangler login"
    exit 1
fi

ACCOUNT=$(wrangler whoami 2>&1 | grep "Account Name" | cut -d: -f2 | xargs)
echo "✅ 已登录: $ACCOUNT"
echo ""

# 步骤 1：检查环境变量
echo "📋 步骤 1/5：检查环境变量"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SECRETS=$(wrangler secret list 2>&1)

check_secret() {
    if echo "$SECRETS" | grep -q "$1"; then
        echo "  ✅ $1"
        return 0
    else
        echo "  ❌ $1 (未设置)"
        return 1
    fi
}

MISSING_SECRETS=0

check_secret "JWT_SECRET" || MISSING_SECRETS=$((MISSING_SECRETS + 1))
check_secret "REPLICATE_API_TOKEN" || MISSING_SECRETS=$((MISSING_SECRETS + 1))
check_secret "STRIPE_SECRET_KEY" || MISSING_SECRETS=$((MISSING_SECRETS + 1))
check_secret "GOOGLE_CLIENT_SECRET" || MISSING_SECRETS=$((MISSING_SECRETS + 1))

if [ $MISSING_SECRETS -gt 0 ]; then
    echo ""
    echo "⚠️  发现 $MISSING_SECRETS 个未设置的环境变量"
    echo ""
    read -p "是否继续设置？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "请设置缺失的环境变量："
        echo "  wrangler secret put SECRET_NAME"
        echo ""
        exit 1
    fi
fi

echo ""

# 步骤 2：验证数据库
echo "📊 步骤 2/5：验证 D1 数据库"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DB_LIST=$(wrangler d1 list 2>&1)

# 检查生产数据库
if echo "$DB_LIST" | grep -q "flux-ai"; then
    echo "  ✅ 生产数据库存在: flux-ai"
else
    echo "  ❌ 生产数据库不存在: flux-ai"
    echo "     请检查 wrangler.toml 中的数据库配置"
    exit 1
fi

# 检查开发数据库（可选）
if echo "$DB_LIST" | grep -q "flux-ai-dev"; then
    echo "  ✅ 开发数据库存在: flux-ai-dev"
else
    echo "  ⚠️  开发数据库不存在: flux-ai-dev（可选）"
fi

# 检查表结构
echo "  🔍 检查表结构..."
TABLES=$(wrangler d1 execute flux-ai --command="SELECT name FROM sqlite_master WHERE type='table'" 2>&1)

if echo "$TABLES" | grep -q "users"; then
    echo "  ✅ 表结构已创建"
else
    echo "  ⚠️  表结构未创建"
    read -p "  是否运行数据库迁移？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "  📦 运行数据库迁移..."
        wrangler d1 execute flux-ai --file=../migrations/d1-schema.sql
        echo "  ✅ 迁移完成"
    else
        echo "  ⚠️  跳过迁移，可能导致部署失败"
    fi
fi

echo ""

# 步骤 3：构建检查
echo "🔨 步骤 3/5：构建检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "index-hono.ts" ]; then
    echo "  ✅ Worker 入口文件存在"
else
    echo "  ❌ Worker 入口文件不存在"
    exit 1
fi

if [ -d "routes" ]; then
    echo "  ✅ 路由目录存在"
else
    echo "  ❌ 路由目录不存在"
    exit 1
fi

echo ""

# 步骤 4：部署确认
echo "🚀 步骤 4/5：部署确认"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  准备部署到 Cloudflare 生产环境"
echo ""
echo "  ⚠️  这将更新生产环境的 Worker"
echo "  ⚠️  请确保已经完成本地测试"
echo ""
read -p "确认部署？(y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 部署已取消"
    exit 0
fi

echo ""

# 步骤 5：执行部署
echo "🚀 步骤 5/5：执行部署"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

wrangler deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 部署成功！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 下一步："
    echo "  1. 测试生产环境 API"
    echo "  2. 验证数据库连接"
    echo "  3. 更新前端 API 地址"
    echo "  4. 监控生产环境"
    echo ""
    echo "📝 查看日志："
    echo "  wrangler tail"
    echo ""
    echo "🌐 Dashboard:"
    echo "  https://dash.cloudflare.com/"
    echo ""
else
    echo ""
    echo "❌ 部署失败"
    echo ""
    echo "🐛 故障排除："
    echo "  1. 检查 wrangler.toml 配置"
    echo "  2. 检查环境变量"
    echo "  3. 查看错误日志"
    echo "  4. 运行: wrangler whoami"
    echo ""
    exit 1
fi
