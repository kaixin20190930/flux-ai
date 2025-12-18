# 🚀 快速部署指南

## 📋 部署概览

本项目采用 **Vercel + Cloudflare Workers** 混合架构：
- **Vercel**: Next.js 应用 + NextAuth + Prisma
- **Cloudflare Workers**: Points System V2 API + D1 数据库

---

## 第一步：Cloudflare Workers 部署（约 15 分钟）

### 1. 使用现有生产数据库

```bash
cd worker
# ✅ 生产数据库 flux-ai 已存在，跳过创建步骤
```

### 2. 验证 wrangler.toml 配置

确认 `worker/wrangler.toml` 中的生产环境配置正确：

```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "flux-ai"
database_id = "011af577-7121-4de9-99b9-d925387ffacc"
```

### 3. 运行数据库迁移

```bash
wrangler d1 execute flux-ai --remote --file=../migrations/d1-points-system-v2.sql
```

### 4. 配置环境变量

```bash
# JWT 密钥
wrangler secret put JWT_SECRET --env production
# 输入: $(openssl rand -base64 32)

# IP 盐值
wrangler secret put IP_SALT --env production
# 输入: $(openssl rand -base64 16)

# Replicate API Token
wrangler secret put REPLICATE_API_TOKEN --env production
# 输入你的 Replicate API token
```

### 5. 部署 Worker

```bash
wrangler deploy --env production
```

记录返回的 Worker URL，例如：`https://flux-ai-worker-prod.你的账号.workers.dev`

---

## 第二步：Vercel 部署（约 10 分钟）

### 1. 配置环境变量

在 Vercel Dashboard 中添加以下环境变量：

```env
# 数据库
DATABASE_URL=你的Neon数据库URL

# NextAuth
NEXTAUTH_URL=https://你的域名.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=你的Google Client ID
GOOGLE_CLIENT_SECRET=你的Google Client Secret

# Replicate
REPLICATE_API_TOKEN=你的Replicate Token

# Worker URL
NEXT_PUBLIC_WORKER_URL=https://flux-ai-worker-prod.你的账号.workers.dev
```

### 2. 部署

```bash
# 方式 1: Git 推送（推荐）
git add .
git commit -m "Deploy Points System V2"
git push origin main

# 方式 2: Vercel CLI
vercel --prod
```

---

## 第三步：验证部署（约 5 分钟）

### 1. 测试未登录用户

1. 打开隐私模式访问：`https://你的域名.com/en/create`
2. 生成一张图片（应该成功）
3. 刷新页面，状态应显示 `0 / 1`
4. 再次生成（应提示达到限制）

### 2. 测试登录用户

1. 注册新账号
2. 检查初始积分（应为 3 积分）
3. 生成图片（应扣除 1 积分）
4. 检查余额（应为 2 积分）

---

## 🔍 故障排除

### Worker 部署失败

```bash
# 查看详细错误
wrangler deploy --env production --verbose

# 检查环境变量
wrangler secret list --env production
```

### Vercel 部署失败

```bash
# 本地构建测试
npm run build

# 查看部署日志
vercel logs
```

### 数据库连接失败

```bash
# 测试 D1 连接
wrangler d1 execute flux-ai-prod --remote --command "SELECT 1;"

# 测试 Prisma 连接
npx prisma db pull
```

---

## 📚 详细文档

- `PRODUCTION_DEPLOYMENT_CHECKLIST.md` - 完整部署检查清单
- `POINTS_SYSTEM_V2_SUMMARY.md` - 系统功能总结
- `.kiro/steering/deployment-architecture.md` - 架构说明

---

**预计总时间**: 30 分钟  
**难度**: ⭐⭐⭐☆☆
