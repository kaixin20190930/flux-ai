#!/bin/bash

# Phase 1 快速启动脚本
# 这个脚本会自动运行所有必要的步骤来启动 Phase 1 安全改进

set -e  # 遇到错误立即退出

echo "🔒 Phase 1 安全改进 - 快速启动"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 步骤 1: 检查环境变量
echo "📋 步骤 1: 检查环境变量..."
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

# 步骤 2: 备份数据库
echo "💾 步骤 2: 备份数据库..."
if [ -f "flux-ai.db" ]; then
    BACKUP_FILE="flux-ai.backup.$(date +%Y%m%d_%H%M%S).db"
    cp flux-ai.db "$BACKUP_FILE"
    echo -e "${GREEN}✅ 数据库已备份到: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  数据库文件不存在，跳过备份${NC}"
fi

echo ""

# 步骤 3: 运行数据库迁移
echo "🗄️  步骤 3: 运行数据库迁移..."
if command -v ts-node &> /dev/null; then
    ts-node scripts/run-security-migration.ts
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 数据库迁移成功${NC}"
    else
        echo -e "${RED}❌ 数据库迁移失败${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  ts-node 未安装，尝试使用 npm...${NC}"
    npm run migrate:security
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 数据库迁移成功${NC}"
    else
        echo -e "${RED}❌ 数据库迁移失败${NC}"
        exit 1
    fi
fi

echo ""

# 步骤 4: 运行测试
echo "🧪 步骤 4: 运行自动化测试..."
read -p "是否运行测试？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v ts-node &> /dev/null; then
        ts-node scripts/test-phase1-security.ts
        TEST_RESULT=$?
    else
        npm run test:security
        TEST_RESULT=$?
    fi
    
    if [ $TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}✅ 所有测试通过${NC}"
    else
        echo -e "${YELLOW}⚠️  部分测试失败，请查看上面的错误信息${NC}"
    fi
else
    echo "跳过测试"
fi

echo ""

# 步骤 5: 总结
echo "================================"
echo "✨ Phase 1 设置完成！"
echo "================================"
echo ""
echo "下一步："
echo "  1. 启动应用: npm run dev"
echo "  2. 访问: http://localhost:3000"
echo "  3. 测试生成功能"
echo "  4. 清除 cookie 后再次测试（应该仍然被限制）"
echo ""
echo "查看完整文档: PHASE1_IMPLEMENTATION_COMPLETE.md"
echo ""
echo "如果遇到问题："
echo "  - 查看日志文件"
echo "  - 检查数据库文件权限"
echo "  - 运行: npm run test:security"
echo ""
echo -e "${GREEN}🎉 准备就绪！${NC}"
