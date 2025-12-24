# Flux AI - AI 图像生成平台

[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-blue)](https://www.typescriptlang.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-100%25-orange)](https://www.cloudflare.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-green)](https://orm.drizzle.team/)

Flux AI 是一个基于 Next.js 14 的 AI 图像生成平台，采用 **100% Cloudflare 原生架构**，支持多种 Flux AI 模型。

🌐 **Live Demo**: [https://flux-ai-img.com](https://flux-ai-img.com)

---

## ✨ 核心特性

- 🎨 **多模型支持** - Flux Schnell, Dev, Pro, 1.1 Pro, 1.1 Ultra
- 🔐 **JWT 认证系统** - 安全的用户认证和会话管理
- 🔑 **Google OAuth 登录** - 快速便捷的 Google 账号登录
- 💎 **积分系统 V2** - 灵活的积分消费和充值机制
- 🌍 **多语言支持** - 20+ 种语言的国际化支持
- 🛠️ **图像工具** - Canny、Depth、Fill、Redux 等图像处理工具
- 💳 **支付集成** - Stripe 支付系统
- 📊 **使用追踪** - 基于 IP + 指纹的防滥用机制
- 🎯 **免费试用** - 匿名用户每天 1 次免费生成

---

## 🏗️ 架构

### 100% Cloudflare 原生部署

```
用户请求
    ↓
Cloudflare CDN (全球边缘节点)
    ↓
Cloudflare Pages (Next.js 前端)
    ↓
Cloudflare Workers (API 层)
    ├─→ JWT 认证
    ├─→ Points System V2
    └─→ 业务逻辑
    ↓
┌──────────────┬──────────────┬──────────────┐
│ D1 Database  │ R2 Storage   │ KV Store     │
│ (用户/积分)   │ (图片)       │ (会话/缓存)   │
└──────────────┴──────────────┴──────────────┘
```

### 技术栈

**前端**
- Next.js 14.2.5 (App Router)
- React 18.3.1
- TypeScript 5.5.4
- Tailwind CSS
- 自定义 i18n (20+ 语言)

**后端**
- Cloudflare Workers
- Hono (Web 框架)
- Drizzle ORM
- jose (JWT)
- bcryptjs (密码哈希)

**数据层**
- Cloudflare D1 (SQLite)
- Cloudflare R2 (对象存储)
- Cloudflare KV (键值存储)

---

## 🚀 快速开始

### 前置要求

- Node.js 18.x+
- npm 9.x+
- Cloudflare 账号
- Wrangler CLI

### 1. 克隆项目

```bash
git clone https://github.com/your-username/flux-ai.git
cd flux-ai
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制环境变量示例文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# Replicate API
REPLICATE_API_TOKEN=你的_Token

# Stripe 支付
STRIPE_SECRET_KEY=你的_Secret_Key
STRIPE_WEBHOOK_SECRET=你的_Webhook_Secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=你的_Publishable_Key

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=你的_Google_Client_ID

# Worker URL
NEXT_PUBLIC_WORKER_URL=https://api.flux-ai-img.com

# Base URLs
NEXT_PUBLIC_BASE_URL=https://flux-ai-img.com
NEXT_PUBLIC_APP_URL=https://flux-ai-img.com

# 其他
NEXT_TELEMETRY_DISABLED=1
IP_SALT=你的_Salt
FINGERPRINT_SALT=你的_Salt
```

### 4. 配置 Cloudflare Worker

```bash
cd worker

# 配置 secrets
wrangler secret put JWT_SECRET
wrangler secret put IP_SALT
wrangler secret put REPLICATE_API_TOKEN
wrangler secret put GOOGLE_CLIENT_SECRET
```

### 5. 运行数据库迁移

```bash
cd worker
wrangler d1 migrations apply flux-ai --remote
```

### 6. 启动开发服务器

```bash
# 前端
npm run dev

# Worker (新终端)
cd worker
wrangler dev
```

访问 http://localhost:3000

---

## 📦 部署

### 部署 Worker (API)

```bash
cd worker
wrangler deploy --env production
```

### 部署 Pages (前端)

1. 推送代码到 GitHub
2. 在 Cloudflare Dashboard 连接 GitHub 仓库
3. 配置构建设置：
   - **Build command**: `npx @cloudflare/next-on-pages@1`
   - **Build output**: `.vercel/output/static`
   - **Node version**: `18.x`
4. 配置环境变量（见上方）
5. 部署

详细部署指南：`DEPLOYMENT_GUIDE.md`

---

## 🗂️ 项目结构

```
flux-ai/
├── app/                    # Next.js 应用 (Pages)
│   ├── [locale]/          # 多语言路由
│   └── i18n/              # 国际化配置
├── worker/                # Cloudflare Workers
│   ├── index-hono.ts     # Hono 应用入口
│   ├── handlers/         # API 处理器
│   │   ├── getUserStatusV2.ts
│   │   └── createGenerationV2.ts
│   └── routes/           # API 路由
├── components/            # React 组件
├── hooks/                 # React Hooks
├── lib/                   # 共享库
├── migrations/           # D1 数据库迁移
├── public/               # 静态资源
├── utils/                # 工具函数
├── wrangler.toml        # Cloudflare 配置
└── package.json
```

---

## 🔧 常用命令

### 开发
```bash
npm run dev              # 启动前端开发服务器
cd worker && wrangler dev  # 启动 Worker 本地开发
```

### 构建
```bash
npm run build            # 构建 Next.js 应用
npm run type-check       # TypeScript 类型检查
npm run lint             # ESLint 检查
```

### 数据库
```bash
cd worker
wrangler d1 migrations apply flux-ai --remote  # 运行迁移
wrangler d1 execute flux-ai --remote --command "SELECT * FROM users LIMIT 10;"  # 查询数据
```

### 部署
```bash
cd worker
wrangler deploy --env production  # 部署 Worker
git push origin main              # 推送代码（Pages 自动部署）
```

---

## 💎 Points System V2

### 未登录用户
- 每天 1 次免费生成（flux-schnell）
- 基于 IP + 指纹追踪
- 达到限制后提示登录

### 登录用户
- 注册送 3 积分
- 不同模型消耗不同积分：
  - flux-schnell: 1 积分
  - flux-dev: 3 积分
  - flux-pro: 5 积分
  - flux-1.1-pro: 8 积分
  - flux-1.1-ultra: 10 积分
- 完整的交易记录
- 积分不足提示购买

---

## 🌍 多语言支持

支持 20+ 种语言：

- 🇺🇸 English
- 🇨🇳 简体中文
- 🇹🇼 繁體中文
- 🇯🇵 日本語
- 🇰🇷 한국어
- 🇪🇸 Español
- 🇵🇹 Português
- 🇩🇪 Deutsch
- 🇫🇷 Français
- 🇮🇹 Italiano
- 🇷🇺 Русский
- 🇸🇦 العربية
- 🇮🇳 हिन्दी
- 🇮🇩 Bahasa Indonesia
- 🇹🇷 Türkçe
- 🇳🇱 Nederlands
- 🇵🇱 Polski
- 🇻🇳 Tiếng Việt
- 🇹🇭 ไทย
- 🇲🇾 Bahasa Melayu

---

## 🔑 Google OAuth 配置

### 1. 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API

### 2. 配置 OAuth 同意屏幕

1. 导航到 **APIs & Services** > **OAuth consent screen**
2. 选择 **External** 用户类型
3. 填写应用信息：
   - **应用名称**: Flux AI
   - **用户支持电子邮件**: 你的邮箱
   - **应用徽标**: 可选
   - **授权域**: `flux-ai-img.com`
   - **开发者联系信息**: 你的邮箱
4. 添加作用域：
   - `userinfo.email`
   - `userinfo.profile`
5. 保存并继续

### 3. 创建 OAuth 2.0 凭据

1. 导航到 **APIs & Services** > **Credentials**
2. 点击 **Create Credentials** > **OAuth client ID**
3. 选择 **Web application**
4. 配置：
   - **名称**: Flux AI Web Client
   - **授权的 JavaScript 来源**:
     - `http://localhost:3000` (开发)
     - `https://flux-ai-img.com` (生产)
   - **授权的重定向 URI**:
     - `http://localhost:3000` (开发)
     - `https://flux-ai-img.com` (生产)
5. 点击 **Create**
6. 复制 **Client ID** 和 **Client Secret**

### 4. 配置环境变量

**前端 (Cloudflare Pages)**:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=你的_Client_ID
```

**后端 (Cloudflare Worker)**:
```bash
cd worker
wrangler secret put GOOGLE_CLIENT_SECRET
# 输入你的 Client Secret
```

### 5. 测试 Google 登录

1. 启动开发服务器
2. 访问登录页面
3. 点击 "使用 Google 登录" 按钮
4. 完成 Google 授权流程
5. 验证登录成功并跳转到创建页面

### 故障排查

#### 问题 1: "redirect_uri_mismatch" 错误

**原因**: 重定向 URI 不匹配

**解决方案**:
1. 检查 Google Cloud Console 中的授权重定向 URI
2. 确保包含当前访问的域名
3. 注意 `http` vs `https` 和尾部斜杠

#### 问题 2: "invalid_client" 错误

**原因**: Client ID 或 Client Secret 不正确

**解决方案**:
1. 验证 `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 环境变量
2. 验证 Worker 的 `GOOGLE_CLIENT_SECRET` secret
3. 重新生成凭据并更新

#### 问题 3: Google 授权页面显示 "This app isn't verified"

**原因**: 应用未通过 Google 验证

**解决方案**:
- 开发阶段：点击 "Advanced" > "Go to [App Name] (unsafe)"
- 生产阶段：提交应用进行 Google 验证

#### 问题 4: 登录后没有跳转

**原因**: 前端回调处理错误

**解决方案**:
1. 检查浏览器控制台错误
2. 验证 Worker API 端点可访问
3. 检查 JWT token 是否正确存储

#### 问题 5: "Token verification failed" 错误

**原因**: Google token 验证失败

**解决方案**:
1. 检查 Worker 日志: `wrangler tail --env production`
2. 验证 Google API 响应
3. 确认 token 未过期

### 安全最佳实践

1. ✅ **永远不要在前端暴露 Client Secret**
2. ✅ **所有 token 验证在服务端完成**
3. ✅ **使用 HTTPS（生产环境）**
4. ✅ **定期轮换 Client Secret**
5. ✅ **限制授权域名**
6. ✅ **记录所有认证尝试**

### 监控和日志

查看 Google OAuth 相关日志：

```bash
# Worker 日志
cd worker
wrangler tail --env production

# 过滤 Google OAuth 日志
wrangler tail --env production | grep "Google OAuth"
```

---

## 🧪 测试

```bash
npm test                 # 运行所有测试
npm run test:watch       # 监听模式
npm run test:coverage    # 生成覆盖率报告
```

---

## 📚 文档

- **部署指南**: `DEPLOYMENT_GUIDE.md`
- **架构说明**: `CLOUDFLARE_ARCHITECTURE.md`
- **最终总结**: `FINAL_DEPLOYMENT_SUMMARY.md`
- **推送阻止解决**: `PUSH_BLOCKED_SOLUTION.md`
- **Worker 配置**: `worker/wrangler.toml`

---

## 🆘 故障排除

### Worker 无法访问
```bash
cd worker
wrangler deployments list --env production
wrangler tail --env production
```

### Pages 构建失败
```bash
npm run build  # 本地测试
# 查看 Cloudflare Dashboard 构建日志
```

### 数据库连接失败
```bash
cd worker
wrangler d1 execute flux-ai --remote --command "SELECT 1;"
```

---

## 📈 性能

- ⚡ 全球响应时间: < 50ms
- ⚡ 数据库查询: < 10ms
- ⚡ API 响应: < 100ms
- ⚡ 冷启动: 0ms

---

## 💰 成本

- Pages: 免费（无限请求）
- Workers: 免费层 100,000 请求/天
- D1: 免费层 5GB 存储
- R2: 免费层 10GB 存储
- KV: 免费层 1GB 存储

**预计月成本**: $0 (免费层足够)

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Pull Request！

---

## 📧 联系

- Website: https://flux-ai-img.com
- GitHub: https://github.com/your-username/flux-ai

---

**Built with ❤️ using 100% Cloudflare**
