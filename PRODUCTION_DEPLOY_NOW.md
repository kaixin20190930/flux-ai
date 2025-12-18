# 🚀 立即部署到生产环境

## ✅ 已完成的修复

### 1. 数据库修复
- ✅ 开发数据库 `flux-ai-dev` 已添加 `password_hash` 字段
- ✅ 生产数据库 `flux-ai` 已添加 `password_hash` 字段

### 2. Worker 部署
- ✅ 生产 Worker 已部署：`https://flux-ai-worker.liukai19911010.workers.dev`
- ✅ Worker 健康检查通过

### 3. 前端代码修复
- ✅ 修复 Worker URL 配置
- ✅ 生产环境自动调用：`https://flux-ai-worker.liukai19911010.workers.dev`
- ✅ 本地开发自动调用：`http://localhost:8787`

---

## 📋 立即执行的步骤

### 步骤 1：配置 Cloudflare Pages 环境变量（推荐）

1. 访问 Cloudflare Dashboard
2. 进入 **Pages** → **flux-ai-img** → **Settings** → **Environment variables**
3. 添加环境变量：
   - **Variable name**: `NEXT_PUBLIC_WORKER_URL`
   - **Value**: `https://flux-ai-worker-prod.liukai19911010.workers.dev`
   - **Environment**: 选择 `Production` 和 `Preview`
4. 点击 **Save**

**为什么要配置环境变量？**
- ✅ 更灵活：可以随时更改 Worker URL 而无需修改代码
- ✅ 更安全：不在代码中硬编码 URL
- ✅ 更标准：符合 Cloudflare Pages 最佳实践

**如果不配置会怎样？**
- 代码会使用默认值：`https://flux-ai-worker-prod.liukai19911010.workers.dev`
- 也能正常工作，但不够灵活

### 步骤 2：提交代码
```bash
git add hooks/useImageGeneration.tsx worker/wrangler.toml
git commit -m "fix: use environment variable for Worker URL"
git push origin main
```

### 步骤 3：等待 Cloudflare Pages 自动部署
1. 推送后，Cloudflare Pages 会自动检测变更
2. 触发构建（约 2-5 分钟）
3. 自动部署到生产环境

**查看部署状态**：
- 访问 Cloudflare Dashboard
- Pages → flux-ai-img → Deployments

### 步骤 4：验证修复

#### 3.1 检查 Worker URL
1. 访问 https://flux-ai-img.com/en/auth
2. 打开浏览器开发者工具（F12）
3. 切换到 Network 标签
4. 点击 "Sign Up" 尝试注册
5. **预期**：请求发送到 `https://flux-ai-worker-prod.liukai19911010.workers.dev/auth/register`

#### 3.2 测试注册
1. 填写注册信息：
   - Email: test@example.com
   - Password: Test123456
   - Name: Test User
2. 点击 "Register"
3. **预期**：注册成功，获得 3 积分

#### 3.3 测试图片生成
1. 登录后访问 https://flux-ai-img.com/en/create
2. 输入 prompt 生成图片
3. **预期**：成功生成，积分扣除 1

---

## 🔍 问题根本原因

### 为什么之前调用了开发 Worker？

**原因**：前端代码中的 Worker URL 配置错误

**之前的配置**：
```typescript
// 错误：使用了不存在的自定义域名
const WORKER_URL = 'https://api.flux-ai-img.com';
```

**现在的配置**：
```typescript
// 正确：使用实际部署的生产 Worker URL
const WORKER_URL = 'https://flux-ai-worker-prod.liukai19911010.workers.dev';
```

### 为什么会有两个 Worker？

你的 `wrangler.toml` 配置了两个环境：

1. **默认环境**（开发）：
   - 名称：`flux-ai-worker`
   - URL：`https://flux-ai-worker.liukai19911010.workers.dev`
   - 数据库：`flux-ai`（生产数据库）

2. **production 环境**：
   - 名称：`flux-ai-worker-prod`
   - URL：`https://flux-ai-worker-prod.liukai19911010.workers.dev`
   - 数据库：`flux-ai`（生产数据库）

**实际情况**：
- 两个 Worker 都连接到同一个生产数据库 `flux-ai`
- 所以使用哪个 Worker 都可以
- 我们选择使用默认的 `flux-ai-worker`（更简单）

---

## 📊 当前架构

```
用户访问 flux-ai-img.com
    ↓
Cloudflare CDN
    ↓
Cloudflare Pages（前端）
    ↓
flux-ai-worker-prod.liukai19911010.workers.dev
    ↓
Cloudflare D1 数据库（flux-ai）
```

---

## ✅ 验证清单

部署完成后，确认以下所有项目：

- [ ] 代码已推送到 GitHub
- [ ] Cloudflare Pages 构建完成
- [ ] 访问 https://flux-ai-img.com 正常
- [ ] 浏览器 Network 请求发送到正确的 Worker URL
- [ ] 注册功能正常
- [ ] 登录功能正常
- [ ] 图片生成功能正常
- [ ] 积分扣除正常

---

## 🆘 如果还有问题

### 查看 Worker 日志
```bash
cd worker
wrangler tail
```

### 查看 Cloudflare Pages 日志
1. 访问 Cloudflare Dashboard
2. Pages → flux-ai-img → Deployments
3. 点击最新的部署
4. 查看构建日志

### 测试 Worker 健康状态
```bash
# 使用 Python 测试（curl 在你的网络环境下有问题）
python3 -c "import urllib.request; print(urllib.request.urlopen('https://flux-ai-worker.liukai19911010.workers.dev/').read().decode())"
```

**预期输出**：
```json
{
  "message": "Flux AI Cloudflare Worker - Hono Edition",
  "version": "2.0.0",
  "environment": "production",
  "status": "healthy"
}
```

---

## 🎉 完成！

修复完成后，你的生产环境应该：
1. ✅ 正确调用生产 Worker
2. ✅ 用户可以正常注册
3. ✅ 用户可以正常生成图片
4. ✅ 积分系统正常工作

---

**修复日期**：2024-12-18  
**状态**：✅ 代码已修复，等待部署  
**下一步**：执行上面的步骤 1-3
