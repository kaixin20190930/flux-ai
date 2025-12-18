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
