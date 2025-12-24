#!/bin/bash

# ============================================================================
# Google OAuth 生产环境配置脚本
# Google OAuth Production Environment Setup Script
# ============================================================================
#
# 本脚本帮助你配置 Google OAuth 所需的生产环境变量
# This script helps you configure production environment variables for Google OAuth
#
# 使用方法 / Usage:
#   chmod +x scripts/setup-google-oauth-production.sh
#   ./scripts/setup-google-oauth-production.sh
#
# ============================================================================

set -e  # 遇到错误立即退出 / Exit on error

# 颜色定义 / Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息 / Print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# 检查是否安装了 wrangler / Check if wrangler is installed
check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        print_error "Wrangler CLI 未安装 / Wrangler CLI is not installed"
        print_info "请运行 / Please run: npm install -g wrangler"
        exit 1
    fi
    print_success "Wrangler CLI 已安装 / Wrangler CLI is installed"
}

# 检查是否已登录 Cloudflare / Check if logged in to Cloudflare
check_cloudflare_auth() {
    if ! wrangler whoami &> /dev/null; then
        print_error "未登录 Cloudflare / Not logged in to Cloudflare"
        print_info "请运行 / Please run: wrangler login"
        exit 1
    fi
    print_success "已登录 Cloudflare / Logged in to Cloudflare"
}

# 主函数 / Main function
main() {
    print_header "Google OAuth 生产环境配置 / Google OAuth Production Setup"
    
    # 检查依赖 / Check dependencies
    print_info "检查依赖 / Checking dependencies..."
    check_wrangler
    check_cloudflare_auth
    
    echo ""
    print_info "本脚本将帮助你配置以下生产环境变量："
    print_info "This script will help you configure the following production environment variables:"
    echo ""
    echo "  1. GOOGLE_CLIENT_SECRET (Cloudflare Worker)"
    echo "  2. NEXT_PUBLIC_GOOGLE_CLIENT_ID (Cloudflare Pages - 需手动配置 / Manual configuration required)"
    echo ""
    
    # 询问是否继续 / Ask to continue
    read -p "是否继续？/ Continue? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "已取消 / Cancelled"
        exit 0
    fi
    
    # ========================================================================
    # 配置 Cloudflare Worker Secrets
    # ========================================================================
    
    print_header "步骤 1: 配置 Cloudflare Worker Secrets / Step 1: Configure Cloudflare Worker Secrets"
    
    print_info "请准备好以下信息（从 Google Cloud Console 获取）："
    print_info "Please prepare the following information (from Google Cloud Console):"
    echo ""
    echo "  • Google OAuth Client Secret"
    echo ""
    print_info "获取方式 / How to obtain:"
    echo "  1. 访问 / Visit: https://console.cloud.google.com"
    echo "  2. APIs & Services > Credentials"
    echo "  3. 找到你的 OAuth 2.0 Client ID / Find your OAuth 2.0 Client ID"
    echo "  4. 复制 Client Secret / Copy Client Secret"
    echo ""
    
    read -p "按 Enter 继续 / Press Enter to continue..."
    
    # 配置 GOOGLE_CLIENT_SECRET
    print_info "配置 GOOGLE_CLIENT_SECRET..."
    echo ""
    
    cd worker
    
    if wrangler secret put GOOGLE_CLIENT_SECRET --env production; then
        print_success "GOOGLE_CLIENT_SECRET 配置成功 / GOOGLE_CLIENT_SECRET configured successfully"
    else
        print_error "GOOGLE_CLIENT_SECRET 配置失败 / GOOGLE_CLIENT_SECRET configuration failed"
        exit 1
    fi
    
    cd ..
    
    # 验证 secrets
    print_info "验证已配置的 secrets / Verifying configured secrets..."
    echo ""
    
    cd worker
    wrangler secret list --env production
    cd ..
    
    echo ""
    print_success "Cloudflare Worker Secrets 配置完成 / Cloudflare Worker Secrets configured"
    
    # ========================================================================
    # 配置 Cloudflare Pages 环境变量（手动）
    # ========================================================================
    
    print_header "步骤 2: 配置 Cloudflare Pages 环境变量 / Step 2: Configure Cloudflare Pages Environment Variables"
    
    print_warning "此步骤需要手动在 Cloudflare Dashboard 中完成"
    print_warning "This step requires manual configuration in Cloudflare Dashboard"
    echo ""
    
    print_info "请按照以下步骤操作 / Please follow these steps:"
    echo ""
    echo "  1. 访问 / Visit: https://dash.cloudflare.com"
    echo "  2. Workers & Pages > 选择你的 Pages 项目 / Select your Pages project"
    echo "  3. Settings > Environment variables"
    echo "  4. 添加变量 / Add variable:"
    echo "     • Name: NEXT_PUBLIC_GOOGLE_CLIENT_ID"
    echo "     • Value: [你的 Google Client ID / Your Google Client ID]"
    echo "     • Environment: Production (和 Preview，如果需要 / and Preview if needed)"
    echo "  5. Save"
    echo "  6. Deployments > Retry deployment (重新部署 / Redeploy)"
    echo ""
    
    print_info "详细说明请查看 / For detailed instructions, see:"
    echo "  .kiro/specs/google-oauth-integration/production-env-setup.md"
    echo ""
    
    read -p "完成后按 Enter 继续 / Press Enter when done..."
    
    # ========================================================================
    # 配置 Google Cloud Console（提醒）
    # ========================================================================
    
    print_header "步骤 3: 配置 Google Cloud Console / Step 3: Configure Google Cloud Console"
    
    print_warning "请确保在 Google Cloud Console 中完成以下配置："
    print_warning "Please ensure the following configurations in Google Cloud Console:"
    echo ""
    echo "  ✓ OAuth 同意屏幕已配置 / OAuth consent screen configured"
    echo "  ✓ OAuth 客户端 ID 已创建 / OAuth client ID created"
    echo "  ✓ 授权重定向 URI 已添加 / Authorized redirect URIs added:"
    echo "    • 开发 / Dev: http://localhost:3000/api/auth/callback/google"
    echo "    • 生产 / Prod: https://[你的域名]/api/auth/callback/google"
    echo "  ✓ 应用已发布（如果是 External 类型）/ App published (if External type)"
    echo ""
    
    print_info "详细说明请查看 / For detailed instructions, see:"
    echo "  .kiro/specs/google-oauth-integration/production-env-setup.md"
    echo ""
    
    read -p "完成后按 Enter 继续 / Press Enter when done..."
    
    # ========================================================================
    # 重新部署
    # ========================================================================
    
    print_header "步骤 4: 重新部署 / Step 4: Redeploy"
    
    print_info "是否现在重新部署 Worker？/ Redeploy Worker now?"
    read -p "(y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "重新部署 Worker / Redeploying Worker..."
        cd worker
        if wrangler deploy --env production; then
            print_success "Worker 部署成功 / Worker deployed successfully"
        else
            print_error "Worker 部署失败 / Worker deployment failed"
            exit 1
        fi
        cd ..
    else
        print_warning "跳过 Worker 部署 / Skipped Worker deployment"
        print_info "稍后可以手动部署 / You can deploy manually later:"
        echo "  cd worker && wrangler deploy --env production"
    fi
    
    # ========================================================================
    # 完成
    # ========================================================================
    
    print_header "配置完成 / Configuration Complete"
    
    print_success "Google OAuth 生产环境配置已完成！"
    print_success "Google OAuth production environment configuration complete!"
    echo ""
    
    print_info "下一步 / Next steps:"
    echo ""
    echo "  1. 确保 Cloudflare Pages 已重新部署 / Ensure Cloudflare Pages is redeployed"
    echo "  2. 测试生产环境登录 / Test production login:"
    echo "     访问 / Visit: https://[你的域名]"
    echo "     点击 Google 登录按钮 / Click Google login button"
    echo "  3. 查看日志 / Check logs:"
    echo "     cd worker && wrangler tail --env production"
    echo ""
    
    print_info "如遇问题，请查看故障排查指南 / For troubleshooting, see:"
    echo "  .kiro/specs/google-oauth-integration/production-env-setup.md"
    echo ""
    
    print_success "🎉 完成！/ Done!"
}

# 运行主函数 / Run main function
main
