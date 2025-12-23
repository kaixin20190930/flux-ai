# 前端部署指南 - Cloudflare Pages

## 🎯 问题诊断

### 当前问题
前端调用 API 时出现 404 错误：
```
POST https://flux-ai-img.com/api/generate 404 (Not Found)
```

### 根本原因
前端缺少 `NEXT_PUBLIC_WORKER_URL` 环境变量配置，导致无法正确调用 Worker API。

---

## ✅ 解决方案

### 1. 本地开发环境

已在 `.env.local` 中添加：
```bash
NEXT_PUBLIC_WORKER_URL=https://flux-ai-worker-prod.liukai19911010.workers.dev
```

**重启本地开发服务器**：
```bash
npm run dev
```

### 2. Cloudflare Pages 生产环境

#### 步骤 1: 登录 Cloudflare Dashboard
访问: https://dash.cloudflare.com

#### 步骤 2: 进入 Pages 项目
1. 点击左侧菜单 **Workers & Pages**
2. 找到你的项目（可能是 `flux-ai` 或类似名称）
3. 点击项目名称进入设置

#### 步骤 3: 添加环境变量
1. 点击 **Settings** 标签
2. 点击 **Environment variables**
3. 点击 **Add variable** 按钮
4. 添加以下变量：

**生产环境 (Production)**:
```
变量名: NEXT_PUBLIC_WORKER_URL
值: https://flux-ai-worker-prod.liukai19911010.workers.dev
```

**预览环境 (Preview)** (可选):
```
变量名: NEXT_PUBLIC_WORKER_URL
值: https://flux-ai-worker-dev.liukai19911010.workers.dev
```

#### 步骤 4: 重新部署
添加环境变量后，需要重新部署前端：

**方法 1: 通过 Git 推送触发**
```bash
git add .
git commit -m "fix: add NEXT_PUBLIC_WORKER_URL environment variable"
git push origin main
```

**方法 2: 在 Cloudflare Dashboard 手动触发**
1. 进入项目的 **Deployments** 标签
2. 点击最新部署右侧的 **...** 菜单
3. 选择 **Retry deployment**

---

## 🔍 验证部署

### 1. 检查环境变量是否生效

在浏览器控制台运行：
```javascript
console.log('Worker URL:', process.env.NEXT_PUBLIC_WORKER_URL);
```

应该输出：
```
Worker URL: https://flux-ai-worker-prod.liukai19911010.workers.dev
```

### 2. 测试 API 调用

打开浏览器开发者工具 (F12)，查看 Network 标签：
- 点击"生成图片"按钮
- 检查请求 URL 是否为：
  ```
  https://flux-ai-worker-prod.liukai19911010.workers.dev/generation/generate
  ```
- 而不是：
  ```
  https://flux-ai-img.com/api/generate  ❌ 错误
  ```

### 3. 使用测试页面

打开项目根目录的 `test-worker-connection.html` 文件：
```bash
open test-worker-connection.html
```

点击"开始测试"按钮，检查 Worker 连接状态。

---

## 📋 完整的环境变量清单

### Cloudflare Pages 需要配置的环境变量

```bash
# Worker API URL (必需)
NEXT_PUBLIC_WORKER_URL=https://flux-ai-worker-prod.liukai19911010.workers.dev

# Replicate API (必需)
REPLICATE_API_TOKEN=你的_Token

# Stripe 支付 (必需)
STRIPE_SECRET_KEY=你的_Secret_Key
STRIPE_WEBHOOK_SECRET=你的_Webhook_Secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=你的_Publishable_Key

# 应用 URL (必需)
NEXT_PUBLIC_BASE_URL=https://flux-ai-img.com
NEXT_PUBLIC_APP_URL=https://flux-ai-img.com

# 安全配置 (必需)
IP_SALT=你的_Salt
FINGERPRINT_SALT=你的_Salt

# 其他
NEXT_TELEMETRY_DISABLED=1
```

---

## 🚨 常见问题

### Q1: 添加环境变量后还是 404？
**A:** 确保已重新部署前端。环境变量只在构建时注入，需要重新构建才能生效。

### Q2: 如何确认前端是否部署在 Cloudflare Pages？
**A:** 
1. 访问 https://flux-ai-img.com
2. 查看页面源代码，搜索 `cloudflare` 或 `pages`
3. 或在 Cloudflare Dashboard 查看 Pages 项目的域名绑定

### Q3: Worker 连接超时或被重置？
**A:** 
1. 检查 Worker 是否正常部署：
   ```bash
   cd worker
   wrangler deployments list --env production
   ```
2. 测试 Worker 健康检查：
   ```bash
   curl https://flux-ai-worker-prod.liukai19911010.workers.dev/
   ```
3. 查看 Worker 日志：
   ```bash
   cd worker
   wrangler tail --env production
   ```

### Q4: 本地开发正常，生产环境 404？
**A:** 
1. 确认 Cloudflare Pages 环境变量已配置
2. 确认前端已重新部署
3. 清除浏览器缓存
4. 检查 Worker 是否正常运行

---

## 📊 架构图

```
用户浏览器
    ↓
https://flux-ai-img.com (Cloudflare Pages)
    ↓
读取 NEXT_PUBLIC_WORKER_URL 环境变量
    ↓
调用 Worker API
    ↓
https://flux-ai-worker-prod.liukai19911010.workers.dev
    ↓
处理请求 (认证、积分、生成图片)
    ↓
返回结果给前端
```

---

## ✅ 部署检查清单

- [ ] `.env.local` 已添加 `NEXT_PUBLIC_WORKER_URL`
- [ ] 本地开发服务器已重启
- [ ] Cloudflare Pages 环境变量已配置
- [ ] 前端已重新部署
- [ ] Worker 已部署并正常运行
- [ ] 浏览器测试通过
- [ ] API 调用指向正确的 Worker URL

---

## 🔗 相关链接

- **前端 URL**: https://flux-ai-img.com
- **Worker URL**: https://flux-ai-worker-prod.liukai19911010.workers.dev
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **测试页面**: `test-worker-connection.html`

---

**最后更新**: 2024-12-23  
**状态**: ✅ 配置完成，等待部署验证
