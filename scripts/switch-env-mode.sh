#!/bin/bash

# 环境配置切换脚本

MODE=$1

if [ -z "$MODE" ]; then
  echo "用法: ./scripts/switch-env-mode.sh [local|ngrok]"
  echo ""
  echo "模式:"
  echo "  local  - 使用 localhost:3000（本地开发）"
  echo "  ngrok  - 使用 ngrok URL（外部访问）"
  exit 1
fi

if [ "$MODE" = "local" ]; then
  echo "🔄 切换到本地开发模式..."
  
  # 更新 NEXTAUTH_URL
  sed -i.bak 's|NEXTAUTH_URL="https://.*ngrok.*"|NEXTAUTH_URL="http://localhost:3000"|g' .env.local
  
  # 更新 BASE_URL
  sed -i.bak 's|NEXT_PUBLIC_BASE_URL=https://.*ngrok.*|NEXT_PUBLIC_BASE_URL=http://localhost:3000|g' .env.local
  sed -i.bak 's|NEXT_PUBLIC_APP_URL=https://.*ngrok.*|NEXT_PUBLIC_APP_URL=http://localhost:3000|g' .env.local
  
  # 更新 Google OAuth redirect
  sed -i.bak 's|GOOGLE_REDIRECT_URI=https://.*ngrok.*/api/auth/google/callback|GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback|g' .env.local
  
  echo "✅ 已切换到本地模式"
  echo "📝 请访问: http://localhost:3000"
  echo "⚠️  注意: Google OAuth 可能需要在 Google Console 中添加 localhost 回调 URL"
  
elif [ "$MODE" = "ngrok" ]; then
  echo "🔄 切换到 ngrok 模式..."
  echo "⚠️  请手动更新 .env.local 中的 ngrok URL"
  echo ""
  echo "需要更新的变量:"
  echo "  - NEXTAUTH_URL"
  echo "  - NEXT_PUBLIC_BASE_URL"
  echo "  - NEXT_PUBLIC_APP_URL"
  echo "  - GOOGLE_REDIRECT_URI"
  echo ""
  echo "📝 然后通过 ngrok URL 访问应用"
  
else
  echo "❌ 未知模式: $MODE"
  echo "请使用 'local' 或 'ngrok'"
  exit 1
fi

# 删除备份文件
rm -f .env.local.bak

echo ""
echo "🔄 请重启开发服务器以应用更改"
