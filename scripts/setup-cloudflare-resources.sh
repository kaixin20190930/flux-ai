#!/bin/bash

# Cloudflare 资源创建脚本
# 用于完全 Cloudflare 迁移

echo "🚀 开始创建 Cloudflare 资源..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 创建 D1 数据库
echo "📊 创建 D1 数据库..."
wrangler d1 create flux-ai-db

echo ""
echo "${YELLOW}⚠️  请将上面输出的 database_id 复制到 wrangler.toml 中${NC}"
echo ""

# 2. 创建 R2 bucket
echo "🗄️  创建 R2 bucket..."
wrangler r2 bucket create flux-ai-images

echo ""
echo "${GREEN}✅ R2 bucket 创建成功${NC}"
echo ""

# 3. 创建 KV namespace (生产环境)
echo "🔑 创建 KV namespace (生产环境)..."
wrangler kv:namespace create "KV"

echo ""
echo "${YELLOW}⚠️  请将上面输出的 id 复制到 wrangler.toml 的 [[kv_namespaces]] 中${NC}"
echo ""

# 4. 创建 KV namespace (预览环境)
echo "🔑 创建 KV namespace (预览环境)..."
wrangler kv:namespace create "KV" --preview

echo ""
echo "${YELLOW}⚠️  请将上面输出的 preview_id 复制到 wrangler.toml 的 [[kv_namespaces]] 中${NC}"
echo ""

echo "${GREEN}✅ 所有 Cloudflare 资源创建完成！${NC}"
echo ""
echo "📝 下一步："
echo "1. 更新 wrangler.toml 配置文件"
echo "2. 设置环境变量 secrets"
echo "3. 开始数据库迁移"
