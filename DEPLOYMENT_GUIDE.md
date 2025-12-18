# 🚀 Cloudflare 部署指南

**架构**: 100% Cloudflare 原生部署

---

## ✅ 当前状态

### 已完成
- ✅ Cloudflare Workers 已部署 (`flux-ai-worker-prod`)
- ✅ D1 数据库已迁移 (`flux-ai`)
- ✅ R2 Bucket 已配置
- ✅ KV Namespace 已配置
- ✅ 代码已构建成功
- ✅ 代码已提交到 Git

### 待完成
- ⏳ 推送代码到 GitHub（被 Secret Scanning 阻止）
- ⏳ Cloudflare Pages 部署
- ⏳ 环境变量配置

---

## 📋 部署架构

```
用户请求
    ↓
Cloudflare CDN (全球边缘节点)
    ↓
flux-ai-img.com
    ↓
Cloudflare Pages (Next.js 应用)
    ├─→ SSR 页面
    ├─→ 静态资源
    └─→ Pages Functions
    ↓
api.flux-ai-img.com
    ↓
Cloudflare Workers ✅ 已部署
    ├─→ JWT 认证
    ├─→ Points System V2
    └─→ 业务逻辑
    ↓
┌──────────────┬──────────────┬──────────────┐
│ D1 Database  │ R2 Storage   │ KV Store     │
│ ✅ 已迁移     │ ✅ 已配置     │ ✅ 已配置     │
└──────────────┴──────────────┴──────────────┘
```

---

## 🚀 部署步骤

### 步骤 1: 解决 Git 推送阻止

**问题**: GitHub Secret Scanning 检测到 API Keys

**解决方案**: 见 `PUSH_BLOCKED_SOLUTION.md`

**推荐方式**:
1. 点击 GitHub 提供的 5 个允许链接
2. 运行: `git push origin main`
3. 立即更换所有暴露的 API Keys

---

### 步骤 2: Cloudflare Pages 部署

#### 如果已连接 GitHub（自动部署）
- 推送后 Cloudflare Pages 会自动检测并部署
- 预计时间: 5-10 分钟

#### 如果首次部署（手动配置）

1. **创建 Pages 项目**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入 **Workers & Pages**
   - 点击 **Create application** → **Pages** → **Connect to Git**
   - 选择仓库: `flux-ai`

2. **配置构建设置**
   ```
   Framework preset: Next.js
   Build command: npx @cloudflare/next-on-pages@1
   Build output: .vercel/output/static
   Node version: 18.x
   ```

3. **配置环境变量**
   ```env
   # Replicate
   REPLICATE_API_TOKEN=你的_Token
   
   # Stripe
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

4. **开始部署**
   - 点击 **Save and Deploy**

---

### 步骤 3: 验证部署

#### 1. 检查 Worker API
```bash
curl https://api.flux-ai-img.com/
```

预期返回:
```json
{
  "message": "Flux AI Cloudflare Worker - Hono Edition",
  "version": "2.0.0",
  "environment": "production",
  "status": "healthy"
}
```

#### 2. 检查主站
- 访问: https://flux-ai-img.com
- 检查: 页面加载、样式、多语言

#### 3. 测试未登录用户
1. 打开隐私模式
2. 访问: `/en/create`
3. 生成一张图片 → 应该成功
4. 刷新页面 → 应显示 `0 / 1`
5. 再次生成 → 应提示达到限制

#### 4. 测试登录用户
1. 注册新账号
2. 检查初始积分 → 应为 3 积分
3. 生成图片 → 应扣除 1 积分
4. 检查余额 → 应为 2 积分

---

## 🔧 故障排除

### Git 推送被阻止
- 查看: `PUSH_BLOCKED_SOLUTION.md`
- 点击 GitHub 允许链接
- 然后推送

### Worker 无法访问
```bash
cd worker
wrangler deployments list --env production
wrangler tail --env production
```

### Pages 构建失败
```bash
# 本地测试
npm run build

# 查看 Cloudflare Dashboard 构建日志
```

### 数据库连接失败
```bash
cd worker
wrangler d1 execute flux-ai --remote --command "SELECT 1;"
```

---

## 📚 相关文档

- **推送阻止解决**: `PUSH_BLOCKED_SOLUTION.md`
- **架构说明**: `CLOUDFLARE_ARCHITECTURE.md`
- **最终总结**: `FINAL_DEPLOYMENT_SUMMARY.md`
- **Worker 配置**: `worker/wrangler.toml`

---

## ✅ 部署检查清单

- [x] Worker 已部署
- [x] D1 数据库已迁移
- [x] R2/KV 已配置
- [x] 代码已构建
- [x] 代码已提交
- [ ] 代码已推送（等待解决 Secret Scanning）
- [ ] Pages 已部署
- [ ] 环境变量已配置
- [ ] 功能测试通过
- [ ] API Keys 已更换

---

**当前进度**: 80% 完成

**下一步**: 解决 Git 推送阻止，然后部署 Pages
