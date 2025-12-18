# 🚀 生产环境部署检查清单

## 📋 部署概览

本项目采用 **Vercel + Cloudflare 混合部署架构**：
- **Vercel**：Next.js 应用 + NextAuth 认证 + Prisma 数据库
- **Cloudflare Workers**：Points System V2 API + D1 数据库

---

## 第一步：准备工作

### 1.1 检查本地环境

```bash
# 1. 确保所有测试通过
npm run build

# 2. 检查 TypeScript 类型
npm run type-check

# 3. 检查 ESLint
npm run lint
```

### 1.2 备份现有数据（如果有）

```bash
# 备份 Neon 数据库（如果需要）
npx tsx scripts/backup-neon-data.ts
```

---

## 第二步：Cloudflare Workers 部署

### 2.1 使用现有生产数据库

```bash
cd worker

# ✅ 生产数据库 flux-ai 已存在
# 数据库 ID: 011af577-7121-4de9-99b9-d925387ffacc
```

### 2.2 验证 wrangler.toml 配置

确认 `worker/wrangler.toml` 中的配置正确：

```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "flux-ai"
database_id = "011af577-7121-4de9-99b9-d925387ffacc"
```

### 2.3 运行数据库迁移

```bash
# 在生产数据库运行迁移
wrangler d1 execute flux-ai --remote --file=../migrations/d1-points-system-v2.sql

# 验证表结构
wrangler d1 execute flux-ai --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

**预期输出**：
```
daily_usage
generation_history
transactions
users (如果已存在)
```

### 2.4 配置生产环境变量

```bash
# 设置 JWT 密钥
wrangler secret put JWT_SECRET --env production
# 输入一个强密码，例如：openssl rand -base64 32

# 设置 IP 盐值
wrangler secret put IP_SALT --env production
# 输入一个随机字符串，例如：openssl rand -base64 16

# 设置 Replicate API Token
wrangler secret put REPLICATE_API_TOKEN --env production
# 输入你的 Replicate API token

# 设置 Google OAuth（如果使用）
wrangler secret put GOOGLE_CLIENT_SECRET --env production
# 输入你的 Google Client Secret
```

### 2.5 部署 Worker

```bash
# 部署到生产环境
wrangler deploy --env production

# 记录返回的 Worker URL，例如：
# https://flux-ai-worker-prod.你的账号.workers.dev
```

### 2.6 验证 Worker 部署

```bash
# 测试健康检查
curl https://flux-ai-worker-prod.你的账号.workers.dev/

# 预期返回：
# {
#   "message": "Flux AI Cloudflare Worker - Hono Edition",
#   "version": "2.0.0",
#   "environment": "production",
#   "status": "healthy"
# }
```

---

## 第三步：Vercel 部署

### 3.1 配置环境变量

在 Vercel Dashboard 中配置以下环境变量：

#### 数据库
```
DATABASE_URL=你的Neon数据库连接字符串
```

#### NextAuth
```
NEXTAUTH_URL=https://你的域名.com
NEXTAUTH_SECRET=生成一个强密码（openssl rand -base64 32）
```

#### Google OAuth
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=你的Google Client ID
GOOGLE_CLIENT_SECRET=你的Google Client Secret
```

#### Replicate API
```
REPLICATE_API_TOKEN=你的Replicate API Token
```

#### Stripe（如果使用）
```
STRIPE_SECRET_KEY=你的Stripe Secret Key
STRIPE_WEBHOOK_SECRET=你的Stripe Webhook Secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=你的Stripe Publishable Key
```

#### Worker URL
```
NEXT_PUBLIC_WORKER_URL=https://flux-ai-worker-prod.你的账号.workers.dev
```

### 3.2 运行 Prisma 迁移

```bash
# 在生产数据库运行 Prisma 迁移
npx prisma migrate deploy

# 生成 Prisma Client
npx prisma generate
```

### 3.3 部署到 Vercel

```bash
# 方式 1：使用 Vercel CLI
vercel --prod

# 方式 2：通过 Git 推送（推荐）
git add .
git commit -m "Deploy Points System V2 to production"
git push origin main
# Vercel 会自动部署
```

### 3.4 验证 Vercel 部署

访问你的域名，检查：
- [ ] 首页正常加载
- [ ] 登录功能正常
- [ ] 图片生成功能正常

---

## 第四步：配置自定义域名（可选）

### 4.1 Cloudflare Worker 自定义域名

在 `worker/wrangler.toml` 中配置：

```toml
[env.production]
name = "flux-ai-worker-prod"
workers_dev = false
route = "api.你的域名.com/*"
```

然后在 Cloudflare Dashboard 中：
1. 添加 DNS 记录：`api.你的域名.com` → Worker
2. 重新部署：`wrangler deploy --env production`

### 4.2 Vercel 自定义域名

在 Vercel Dashboard 中：
1. Project Settings → Domains
2. 添加你的域名
3. 配置 DNS 记录（Vercel 会提供指引）

---

## 第五步：测试生产环境

### 5.1 测试未登录用户免费额度

1. 打开浏览器隐私模式
2. 访问：https://你的域名.com/en/create
3. 生成一张图片（应该成功）
4. 刷新页面，状态应该显示 `0 / 1`
5. 再次尝试生成（应该提示达到限制）

### 5.2 测试登录用户积分扣除

1. 注册一个新账号
2. 检查初始积分（应该是 3 积分）
3. 生成一张图片（应该扣除 1 积分）
4. 检查余额（应该是 2 积分）

### 5.3 测试数据库记录

```bash
# 连接到生产 D1 数据库
cd worker

# 查看 daily_usage 表
wrangler d1 execute flux-ai-prod --remote --command "
  SELECT COUNT(*) as count FROM daily_usage;
"

# 查看 generation_history 表
wrangler d1 execute flux-ai-prod --remote --command "
  SELECT COUNT(*) as count FROM generation_history;
"

# 查看 transactions 表
wrangler d1 execute flux-ai-prod --remote --command "
  SELECT COUNT(*) as count FROM transactions;
"
```

---

## 第六步：监控和日志

### 6.1 Cloudflare Workers 日志

```bash
# 实时查看 Worker 日志
wrangler tail --env production

# 或在 Cloudflare Dashboard 查看：
# Workers & Pages → flux-ai-worker-prod → Logs
```

### 6.2 Vercel 日志

在 Vercel Dashboard 中：
- Project → Deployments → 选择部署 → Logs

### 6.3 设置告警（推荐）

在 Cloudflare Dashboard 中：
- Workers & Pages → flux-ai-worker-prod → Settings → Alerts
- 配置错误率告警、请求量告警等

---

## 第七步：性能优化

### 7.1 启用 Cloudflare CDN

确保静态资源通过 Cloudflare CDN 分发：
- 图片
- CSS/JS 文件
- 字体文件

### 7.2 配置缓存策略

在 Cloudflare Dashboard 中：
- Caching → Configuration
- 设置合适的缓存规则

### 7.3 启用 Vercel Analytics

```bash
# 安装 Vercel Analytics
npm install @vercel/analytics

# 在 app/layout.tsx 中添加
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 第八步：安全检查

### 8.1 环境变量安全

- [ ] 所有密钥都使用 `wrangler secret` 或 Vercel 环境变量
- [ ] 没有在代码中硬编码任何密钥
- [ ] `.env.local` 已添加到 `.gitignore`

### 8.2 API 安全

- [ ] 所有敏感 API 都需要认证
- [ ] CORS 配置正确
- [ ] Rate limiting 已启用

### 8.3 数据库安全

- [ ] 数据库连接使用 SSL
- [ ] 密码已哈希存储
- [ ] SQL 注入防护（Prisma 自动处理）

---

## 第九步：回滚计划

### 9.1 Worker 回滚

```bash
# 查看部署历史
wrangler deployments list --env production

# 回滚到上一个版本
wrangler rollback --env production
```

### 9.2 Vercel 回滚

在 Vercel Dashboard 中：
- Project → Deployments
- 选择之前的部署 → Promote to Production

### 9.3 数据库回滚

```bash
# 如果需要回滚数据库迁移
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## 第十步：部署后验证

### 10.1 功能检查清单

- [ ] 首页加载正常
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] 未登录用户免费生成正常
- [ ] 登录用户积分扣除正常
- [ ] 图片生成功能正常
- [ ] 刷新页面状态保持正确
- [ ] 达到限制时正确提示

### 10.2 性能检查

- [ ] 首页加载时间 < 3 秒
- [ ] API 响应时间 < 500ms
- [ ] 图片生成时间合理（取决于 Replicate）

### 10.3 监控设置

- [ ] Cloudflare Workers 告警已配置
- [ ] Vercel 部署通知已启用
- [ ] 数据库监控已设置

---

## 🎯 部署完成检查

完成以下所有项目后，部署即完成：

- [ ] Cloudflare Worker 已部署并正常运行
- [ ] D1 数据库已创建并迁移完成
- [ ] Vercel 应用已部署并正常运行
- [ ] 所有环境变量已正确配置
- [ ] 自定义域名已配置（如果需要）
- [ ] 生产环境测试全部通过
- [ ] 监控和日志已设置
- [ ] 安全检查全部通过
- [ ] 回滚计划已准备

---

## 📞 故障排除

### Worker 部署失败

```bash
# 检查 wrangler.toml 配置
cat worker/wrangler.toml

# 检查环境变量
wrangler secret list --env production

# 查看详细错误
wrangler deploy --env production --verbose
```

### Vercel 部署失败

```bash
# 本地构建测试
npm run build

# 检查环境变量
vercel env pull

# 查看部署日志
vercel logs
```

### 数据库连接失败

```bash
# 测试 Prisma 连接
npx prisma db pull

# 测试 D1 连接
wrangler d1 execute flux-ai-prod --remote --command "SELECT 1;"
```

---

## 📚 相关文档

- `POINTS_SYSTEM_V2_SUMMARY.md` - 系统功能总结
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - 详细部署指南
- `.kiro/steering/deployment-architecture.md` - 架构说明

---

**部署日期**：____年____月____日  
**部署人员**：________________  
**版本**：Points System V2.0  
**状态**：⬜ 准备中 / ⬜ 进行中 / ⬜ 已完成
