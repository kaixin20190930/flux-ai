#!/bin/bash

# Points System V2 - 生产环境 Secrets 配置脚本

echo "🔐 配置 Cloudflare Worker 生产环境 Secrets"
echo "============================================"
echo ""

cd "$(dirname "$0")"

# JWT_SECRET
echo "📝 设置 JWT_SECRET..."
echo "生成的密钥: Tv3lwWQLbcykPeWhWtoauijp34BX+xIfxXl8HvakopU="
echo "Tv3lwWQLbcykPeWhWtoauijp34BX+xIfxXl8HvakopU=" | wrangler secret put JWT_SECRET --env production

# IP_SALT
echo ""
echo "📝 设置 IP_SALT..."
echo "生成的盐值: VX1N2Xk0zV6U3XZFjydkjw=="
echo "VX1N2Xk0zV6U3XZFjydkjw==" | wrangler secret put IP_SALT --env production

# REPLICATE_API_TOKEN
echo ""
echo "📝 设置 REPLICATE_API_TOKEN..."
echo "⚠️  请手动输入你的 Replicate API Token:"
wrangler secret put REPLICATE_API_TOKEN --env production

echo ""
echo "✅ 所有 Secrets 配置完成！"
echo ""
echo "验证配置:"
wrangler secret list --env production
