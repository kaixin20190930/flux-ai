# 生产环境调试指南

## 🔍 问题诊断

### 现象
生产环境中，前端仍然调用 `/api/generate` 而不是 Worker URL。

### 原因
`NEXT_PUBLIC_WORKER_URL` 环境变量在**构建时**没有被注入到生产代码中。

---

## 📋 检查清单

### 1. 确认前端部署平台

**问题**: 你的前端部署在哪里？

- [ ] Cloudflare Pages
- [ ] Vercel
- [ ] 其他平台

**如何确认**:
1. 访问 https://flux-ai-img.com
2. 打开开发者工具 (F12)
3. 查看 Network 标签中的响应头
4. 查找 `server` 或 `x-powered-by` 头

---

## 🔧 解决方案

### 方案 A: Cloudflare Pages

#### 步骤 1: 登录 Cloudflare Dashboard
访问: https://dash.cloudflare.com

#### 步骤 2: 找到 Pages 项目
1. 点击左侧菜单 **Workers & Pages**
2. 找到你的项目（可能叫 `flux-ai` 或类似名称）
3. 点击项目名称

#### 步骤 3: 添加环境变量
1. 点击 **Settings** 标签
2. 点击 **Environment variables**
3. 点击 **Add variable**

**生产环境变量**:
```
Variable name: NEXT_PUBLIC_WORKER_URL
Value: https://flux-ai-worker-prod.liukai19911010.workers.dev
Environment: Production
```

**预览环境变量** (可选):
```
Variable name: NEXT_PUBLIC_WORKER_URL
Value: https://flux-ai-worker-dev.liukai19911010.workers.dev
Environment: Preview
```

#### 步骤 4: 重新部署
添加环境变量后，需要触发新的部署：

**方法 1: Git 推送**
```bash
git add .
git commit -m "trigger rebuild with env vars" --allow-empty
git push origin main
```

**方法 2: 手动重新部署**
1. 在 Cloudflare Dashboard 中
2. 进入项目的 **Deployments** 标签
3. 点击最新部署右侧的 **...** 菜单
4. 选择 **Retry deployment**

---

### 方案 B: Vercel

#### 步骤 1: 登录 Vercel Dashboard
访问: https://vercel.com/dashboard

#### 步骤 2: 找到项目
1. 找到你的项目
2. 点击项目名称

#### 步骤 3: 添加环境变量
1. 点击 **Settings** 标签
2. 点击左侧的 **Environment Variables**
3. 添加新变量：

```
Name: NEXT_PUBLIC_WORKER_URL
Value: https://flux-ai-worker-prod.liukai19911010.workers.dev
Environment: Production, Preview, Development (全选)
```

#### 步骤 4: 重新部署
```bash
vercel --prod
```

或在 Vercel Dashboard 中点击 **Redeploy**。

---

## 🧪 验证环境变量

### 方法 1: 检查构建日志

在部署平台的构建日志中搜索：
```
NEXT_PUBLIC_WORKER_URL
```

应该看到类似：
```
✓ Environment variables loaded
  NEXT_PUBLIC_WORKER_URL: https://flux-ai-worker-prod.liukai19911010.workers.dev
```

### 方法 2: 检查生产代码

部署完成后，访问生产网站：
1. 打开开发者工具 (F12)
2. 在 Console 中运行：
```javascript
console.log('WORKER_URL:', process.env.NEXT_PUBLIC_WORKER_URL);
```

**注意**: 这在生产环境中可能不工作，因为 `process.env` 在构建时被替换。

### 方法 3: 查看页面源代码

1. 访问 https://flux-ai-img.com
2. 右键 → 查看页面源代码
3. 搜索 `WORKER_URL` 或 `flux-ai-worker-prod`
4. 应该能找到硬编码的 URL

---

## 🔍 调试技巧

### 1. 添加临时调试代码

在 `hooks/useImageGeneration.tsx` 中添加：

```typescript
// 临时调试：强制使用生产 URL
const WORKER_URL = 'https://flux-ai-worker-prod.liukai19911010.workers.dev';

console.log('🔧 FORCED Worker URL:', WORKER_URL);
```

然后重新部署，看是否能正常工作。

### 2. 检查 Next.js 配置

查看 `next.config.js`，确保没有覆盖环境变量：

```javascript
// next.config.js
module.exports = {
  env: {
    // 不要在这里定义 NEXT_PUBLIC_* 变量
  },
  // ...
}
```

### 3. 检查 .gitignore

确保 `.env.local` 在 `.gitignore` 中（应该是）：
```
.env*.local
```

这样本地的 `.env.local` 不会被提交到 Git。

---

## 📊 预期结果

正确配置后，生产环境应该：

1. **控制台日志**:
```javascript
🔧 Worker URL Configuration: {
  NEXT_PUBLIC_WORKER_URL: "https://flux-ai-worker-prod.liukai19911010.workers.dev",
  NODE_ENV: "production",
  WORKER_URL: "https://flux-ai-worker-prod.liukai19911010.workers.dev"
}
```

2. **Network 请求**:
```
Request URL: https://flux-ai-worker-prod.liukai19911010.workers.dev/generation/generate
Status: 200 OK
```

3. **页面功能**:
- ✅ 图片生成成功
- ✅ 没有 404 错误
- ✅ 正常显示生成的图片

---

## 🆘 如果还是不行

### 临时解决方案：硬编码 URL

如果环境变量一直不生效，可以临时硬编码：

```typescript
// hooks/useImageGeneration.tsx
const WORKER_URL = 'https://flux-ai-worker-prod.liukai19911010.workers.dev';
```

然后提交并重新部署。

**注意**: 这不是最佳实践，但可以快速验证 Worker 是否正常工作。

---

## 📞 需要的信息

请提供以下信息以便进一步诊断：

1. **前端部署平台**: Cloudflare Pages / Vercel / 其他？
2. **构建日志**: 是否显示环境变量已加载？
3. **控制台日志**: 部署后的完整 `🔧 Worker URL Configuration` 输出
4. **Network 请求**: 实际发送到哪个 URL？

---

**最后更新**: 2024-12-23  
**状态**: ⏳ 等待确认部署平台和环境变量配置
