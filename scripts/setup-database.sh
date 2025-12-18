#!/bin/bash

# PostgreSQL 数据库自动设置脚本

set -e

echo "🚀 开始设置 PostgreSQL 数据库..."
echo ""

# 检查 Homebrew
if ! command -v brew &> /dev/null; then
    echo "❌ 错误: 未找到 Homebrew"
    echo "请先安装 Homebrew: https://brew.sh"
    exit 1
fi

echo "✅ 找到 Homebrew"

# 检查 PostgreSQL 是否已安装
if ! command -v psql &> /dev/null; then
    echo "📦 正在安装 PostgreSQL..."
    brew install postgresql@14
    echo "✅ PostgreSQL 安装完成"
else
    echo "✅ PostgreSQL 已安装"
fi

# 启动 PostgreSQL 服务
echo "🔄 启动 PostgreSQL 服务..."
brew services start postgresql@14 || brew services restart postgresql@14
sleep 3

echo "✅ PostgreSQL 服务已启动"

# 创建数据库
echo "📊 创建数据库 'fluxai'..."
if psql -lqt | cut -d \| -f 1 | grep -qw fluxai; then
    echo "ℹ️  数据库 'fluxai' 已存在"
else
    createdb fluxai
    echo "✅ 数据库 'fluxai' 创建成功"
fi

# 获取当前用户名
USERNAME=$(whoami)
echo ""
echo "📝 你的用户名是: $USERNAME"
echo ""
echo "✅ 数据库设置完成！"
echo ""
echo "下一步："
echo "1. 更新 .env.local 文件中的 DATABASE_URL"
echo "2. 运行: npm run prisma:migrate:dev"
