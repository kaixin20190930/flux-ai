#!/bin/bash

# Phase 1 安装脚本
# 安装必要的依赖并运行迁移

set -e

echo "🔧 Phase 1 安装和设置"
echo "===================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 步骤 1: 安装 better-sqlite3
echo "📦 步骤 1: 安装 better-sqlite3..."
if npm list better-sqlite3 &>/dev/null; then
    echo -e "${GREEN}✅ better-sqlite3 已安装${NC}"
else
    echo "正在安装 better-sqlite3..."
    npm install --save-dev better-sqlite3
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ better-sqlite3 安装成功${NC}"
    else
        echo -e "${RED}❌ better-sqlite3 安装失败${NC}"
        exit 1
    fi
fi

echo ""

# 步骤 2: 检查环境变量
echo "📋 步骤 2: 检查环境变量..."
if [ -f .env.local ]; then
    if grep -q "IP_SALT=" .env.local && grep -q "FINGERPRINT_SALT=" .env.local; then
        echo -e "${GREEN}✅ 环境变量已配置${NC}"
    else
        echo -e "${YELLOW}⚠️  环境变量未完全配置${NC}"
        echo "正在生成随机 salt..."
        
        IP_SALT=$(openssl rand -hex 16)
        FINGERPRINT_SALT=$(openssl rand -hex 16)
        
        echo "" >> .env.local
        echo "# Security - IP and Fingerprint Salts (Phase 1)" >> .env.local
        echo "IP_SALT=$IP_SALT" >> .env.local
        echo "FINGERPRINT_SALT=$FINGERPRINT_SALT" >> .env.local
        
        echo -e "${GREEN}✅ 环境变量已添加到 .env.local${NC}"
    fi
else
    echo -e "${RED}❌ .env.local 文件不存在${NC}"
    exit 1
fi

echo ""

# 步骤 3: 备份数据库（如果存在）
echo "💾 步骤 3: 备份数据库..."
if [ -f "flux-ai.db" ]; then
    BACKUP_FILE="flux-ai.backup.$(date +%Y%m%d_%H%M%S).db"
    cp flux-ai.db "$BACKUP_FILE"
    echo -e "${GREEN}✅ 数据库已备份到: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  数据库文件不存在，将创建新数据库${NC}"
fi

echo ""

# 步骤 4: 运行数据库迁移
echo "🗄️  步骤 4: 运行数据库迁移..."
npx tsx scripts/run-security-migration.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库迁移成功${NC}"
else
    echo -e "${RED}❌ 数据库迁移失败${NC}"
    exit 1
fi

echo ""
echo "================================"
echo -e "${GREEN}✨ Phase 1 安装完成！${NC}"
echo "================================"
echo ""
echo "下一步："
echo "  1. 运行测试: npm run test:security"
echo "  2. 启动应用: npm run dev"
echo ""
