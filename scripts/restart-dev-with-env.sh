#!/bin/bash

echo "🔄 重启开发服务器并加载环境变量..."
echo ""

# 检查 .env.local 是否存在
if [ ! -f .env.local ]; then
    echo "❌ 错误: .env.local 文件不存在"
    exit 1
fi

# 显示关键环境变量
echo "📋 当前环境变量配置:"
echo "-----------------------------------"
grep "NEXT_PUBLIC_WORKER_URL" .env.local || echo "⚠️  NEXT_PUBLIC_WORKER_URL 未配置"
echo "-----------------------------------"
echo ""

# 杀死现有的 Next.js 进程
echo "🛑 停止现有的开发服务器..."
pkill -f "next dev" 2>/dev/null || echo "没有运行中的开发服务器"
sleep 2

# 清除 Next.js 缓存
echo "🧹 清除 Next.js 缓存..."
rm -rf .next

# 启动开发服务器
echo ""
echo "🚀 启动开发服务器..."
echo "-----------------------------------"
echo "访问: http://localhost:3000"
echo "按 Ctrl+C 停止服务器"
echo "-----------------------------------"
echo ""

npm run dev
