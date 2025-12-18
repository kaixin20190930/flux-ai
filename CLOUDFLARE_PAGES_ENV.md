# Cloudflare Pages 环境变量配置

## 📋 需要配置的环境变量

### 生产环境（Production）

在 Cloudflare Dashboard 中配置以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXT_PUBLIC_WORKER_URL` | `https://flux-ai-worker-prod.liukai19911010.workers.dev` | Worker API 地址 |

### 预览环境（Preview）

建议与生产环境使用相同配置，或者使用开发 Worker：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXT_PUBLIC_WORKER_URL` | `https://flux-ai-worker-prod.liukai19911010.workers.dev` | Worker API 地址 |

---

## 🔧 配置步骤

### 方式 1：通过 Cloudflare Dashboard（推荐）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择你的账号
3. 进入 **Pages** → **flux-ai-img**
4. 点击 **Settings** 标签
5. 在左侧菜单选择 **Environment variables**
6. 点击 **Add variable**
7. 填写：
   - **Variable name**: `NEXT_PUBLIC_WORKER_URL`
   - **Value**: `https://flux-ai-worker-prod.liukai19911010.workers.dev`
8. 选择环境：
   - ✅ Production
   - ✅ Preview
9. 点击 **Save**

### 方式 2：通过 Wrangler CLI

```bash
# 设置生产环境变量
wrangler pages project env add NEXT_PUBLIC_WORKER_URL production

# 输入值
https://flux-ai-worker-prod.liukai19911010.workers.dev

# 设置预览环境变量
wrangler pages project env add NEXT_PUBLIC_WORKER_URL preview

# 输入值
https://flux-ai-worker-prod.liukai19911010.workers.dev
```

---

## 🔍 验证配置

### 检查环境变量是否生效

1. 部署完成后，访问你的网站
2. 打开浏览器开发者工具（F12）
3. 在 Console 中执行：
```javascript
console.log(process.env.NEXT_PUBLIC_WORKER_URL);
```

**注意**：在客户端代码中，`process.env` 在构建时会被替换为实际值。

### 检查 API 请求

1. 打开 Network 标签
2. 执行任何需要调用 Worker 的操作（如注册、生成图片）
3. 查看请求 URL
4. **预期**：请求发送到 `https://flux-ai-worker-prod.liukai19911010.workers.dev`

---

## 📝 代码中如何使用

### 前端代码（Next.js）

```typescript
// hooks/useImageGeneration.tsx
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 
    (process.env.NODE_ENV === 'production'
        ? 'https://flux-ai-worker-prod.liukai19911010.workers.dev'  // 默认值
        : 'http://localhost:8787');
```

**工作原理**：
1. 优先使用环境变量 `NEXT_PUBLIC_WORKER_URL`
2. 如果没有配置，使用默认值
3. 本地开发自动使用 `http://localhost:8787`

### 为什么要用 `NEXT_PUBLIC_` 前缀？

Next.js 要求所有暴露给客户端的环境变量必须以 `NEXT_PUBLIC_` 开头。

- ✅ `NEXT_PUBLIC_WORKER_URL` - 可以在客户端使用
- ❌ `WORKER_URL` - 只能在服务端使用

---

## 🌍 不同环境的配置

### 本地开发

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_WORKER_URL=http://localhost:8787
```

### Cloudflare Pages 预览环境

在 Cloudflare Dashboard 中配置 Preview 环境变量：

```
NEXT_PUBLIC_WORKER_URL=https://flux-ai-worker-prod.liukai19911010.workers.dev
```

### Cloudflare Pages 生产环境

在 Cloudflare Dashboard 中配置 Production 环境变量：

```
NEXT_PUBLIC_WORKER_URL=https://flux-ai-worker-prod.liukai19911010.workers.dev
```

---

## 🔄 更新环境变量

### 如果需要更改 Worker URL

1. 在 Cloudflare Dashboard 中更新环境变量
2. **重要**：需要重新部署才能生效
3. 两种方式触发重新部署：
   - 推送新的代码到 GitHub
   - 在 Cloudflare Dashboard 中点击 **Retry deployment**

---

## 🆘 故障排除

### 问题：环境变量没有生效

**检查步骤**：
1. 确认在 Cloudflare Dashboard 中已保存环境变量
2. 确认选择了正确的环境（Production/Preview）
3. 重新部署应用
4. 清除浏览器缓存

### 问题：本地开发无法连接 Worker

**解决方案**：
1. 确保 Worker 正在运行：
```bash
cd worker
wrangler dev
```

2. 检查 `.env.local` 文件：
```env
NEXT_PUBLIC_WORKER_URL=http://localhost:8787
```

3. 重启开发服务器：
```bash
npm run dev
```

### 问题：生产环境仍然调用错误的 Worker

**解决方案**：
1. 检查 Cloudflare Pages 环境变量配置
2. 查看最新部署的构建日志
3. 确认环境变量在构建时被正确注入
4. 在浏览器 Console 中检查实际使用的 URL

---

## 📚 相关文档

- [Cloudflare Pages 环境变量文档](https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables)
- [Next.js 环境变量文档](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- `PRODUCTION_DEPLOY_NOW.md` - 部署步骤
- `.env.example` - 环境变量示例

---

**最后更新**：2024-12-18  
**适用版本**：Cloudflare Pages + Next.js 14
