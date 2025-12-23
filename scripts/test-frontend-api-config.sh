#!/bin/bash

# 测试前端 API 配置
# 验证环境变量是否正确设置

echo "🔍 检查前端 API 配置..."
echo ""

# 检查 .env.local 文件
if [ ! -f .env.local ]; then
    echo "❌ 错误: .env.local 文件不存在"
    exit 1
fi

# 检查 NEXT_PUBLIC_WORKER_URL
if grep -q "NEXT_PUBLIC_WORKER_URL=" .env.local; then
    WORKER_URL=$(grep "NEXT_PUBLIC_WORKER_URL=" .env.local | cut -d '=' -f 2)
    echo "✅ NEXT_PUBLIC_WORKER_URL 已配置: $WORKER_URL"
else
    echo "❌ 错误: NEXT_PUBLIC_WORKER_URL 未配置"
    exit 1
fi

# 检查 Worker 是否可访问
echo ""
echo "🌐 测试 Worker 连接..."
if curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL" | grep -q "200\|404"; then
    echo "✅ Worker 可访问: $WORKER_URL"
else
    echo "⚠️  警告: Worker 可能无法访问: $WORKER_URL"
fi

# 检查前端代码中的 API 调用
echo ""
echo "📝 检查前端代码中的 API 配置..."

# 检查 useImageGeneration.tsx
if grep -q "NEXT_PUBLIC_WORKER_URL" hooks/useImageGeneration.tsx; then
    echo "✅ useImageGeneration.tsx 使用 NEXT_PUBLIC_WORKER_URL"
else
    echo "⚠️  警告: useImageGeneration.tsx 未使用 NEXT_PUBLIC_WORKER_URL"
fi

# 检查 api-config.ts
if [ -f lib/api-config.ts ]; then
    echo "✅ lib/api-config.ts 存在"
else
    echo "⚠️  警告: lib/api-config.ts 不存在"
fi

echo ""
echo "✅ 前端 API 配置检查完成"
echo ""
echo "📋 下一步操作:"
echo "1. 如果前端正在运行，请重启: npm run dev"
echo "2. 如果已部署到 Cloudflare Pages，需要:"
echo "   - 在 Cloudflare Dashboard 添加环境变量"
echo "   - 重新部署前端"
echo ""
echo "🔗 生产环境 Worker URL: https://flux-ai-worker-prod.liukai19911010.workers.dev"
echo "🔗 前端 URL: https://flux-ai-img.com"
