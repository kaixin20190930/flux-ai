# 生产环境调试检查清单

## 🔍 问题现象

生产环境中，前端仍然调用 `/api/generate` 而不是 Worker URL，即使：
- ✅ `NEXT_PUBLIC_WORKER_URL` 已在部署平台配置
- ✅ 前端已重新部署
- ✅ 代码中正确使用了环境变量

## 📋 逐步排查

### 步骤 1: 确认环境变量在构建时可用

在生产环境的浏览器控制台中，查看调试日志：

```javascript
🔧 Worker URL Configuration: {
  NEXT_PUBLIC_WORKER_URL: ???,  // 这里是什么值？
  NODE_ENV: "production",
  WORKER_URL: ???  // 这里是什么值？
}
```

**关键问题**：
- `NEXT_PUBLIC_WORKER_URL` 的值是什么？
- `WORKER_URL` 的值是什么？

### 步骤 2: 检查实际的请求 URL

在 Network 标签中，查看失败的请求：

```
Request URL: ???  // 完整的 URL 是什么？
```

**可能的情况**：

#### 情况 A: 请求 URL 是相对路径
```
Request URL: https://flux-ai-img.com/api/generate
```
**说明**: `WORKER_URL` 是 `undefined` 或空字符串，导致使用了相对路径。

#### 情况 B: 请求 URL 包含 Worker 域名
```
Request URL: https://flux-ai-worker-prod.liukai19911010.workers.dev/generation/generate
```
**说明**: 环境变量正确，但可能是其他错误（CORS、Worker 问题等）。

### 步骤 3: 检查构建日志

在部署平台（Cloudflare Pages / Vercel）的构建日志中搜索：

```
NEXT_PUBLIC_WORKER_URL
```

**应该看到**：
```
✓ Environment variables loaded
  NEXT_PUBLIC_WORKER_URL=https://flux-ai-worker-prod.liukai19911010.workers.dev
```

**如果没有看到**：
- 环境变量配置错误
- 环境变量未应用到正确的环境（Production / Preview）

### 步骤 4: 检查部署时间

确认最新的部署时间是在你配置环境变量**之后**：

1. 查看部署平台的 Deployments 页面
2. 确认最新部署的时间戳
3. 确认环境变量配置的时间戳

**如果部署时间早于环境变量配置时间**：
- 需要触发新的部署

### 步骤 5: 检查环境变量作用域

确认环境变量应用到了正确的环境：

**Cloudflare Pages**:
- Production environment
- Preview environment
- 两者都需要配置

**Vercel**:
- Production
- Preview
- Development
- 建议全部勾选

---

## 🎯 根据排查结果的解决方案

### 结果 A: `NEXT_PUBLIC_WORKER_URL` 是 `undefined`

**原因**: 环境变量未在构建时注入

**解决方案**:
1. 确认环境变量名称完全正确（区分大小写）
2. 确认环境变量应用到 Production 环境
3. 触发新的部署：
   ```bash
   git commit --allow-empty -m "trigger rebuild"
   git push origin main
   ```

### 结果 B: `NEXT_PUBLIC_WORKER_URL` 有值，但 `WORKER_URL` 是 `undefined`

**原因**: 代码逻辑问题

**检查代码**:
```typescript
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 
    (process.env.NODE_ENV === 'production'
        ? 'https://flux-ai-worker-prod.liukai19911010.workers.dev'
        : 'http://localhost:8787');
```

这个逻辑应该总是有值。如果 `WORKER_URL` 是 `undefined`，说明代码被修改或有其他问题。

### 结果 C: `WORKER_URL` 有正确的值，但请求还是发送到 `/api/generate`

**原因**: 可能有其他代码在调用 API

**排查**:
1. 检查是否有多个版本的 `useImageGeneration` hook
2. 检查是否有其他组件直接调用 `/api/generate`
3. 检查浏览器缓存是否使用了旧代码

**解决方案**:
```bash
# 强制刷新浏览器
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

---

## 🔧 立即执行的诊断命令

### 1. 检查当前代码

```bash
# 查看 useImageGeneration.tsx 的 WORKER_URL 定义
grep -A 5 "const WORKER_URL" hooks/useImageGeneration.tsx
```

**预期输出**:
```typescript
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 
    (process.env.NODE_ENV === 'production'
        ? 'https://flux-ai-worker-prod.liukai19911010.workers.dev'
        : 'http://localhost:8787');
```

### 2. 检查是否有其他版本

```bash
# 查找所有 useImageGeneration 文件
find . -name "*useImageGeneration*" -type f | grep -v node_modules
```

**预期输出**:
```
./hooks/useImageGeneration.tsx
./hooks/useImageGeneration-old-backup.tsx  # 备份文件，不应该被使用
```

### 3. 检查哪个组件在使用

```bash
# 查找导入 useImageGeneration 的地方
grep -r "from.*useImageGeneration" --include="*.tsx" --include="*.ts" | grep -v node_modules
```

**预期输出**:
```
components/AIImageGenerator.tsx:import {useImageGeneration} from '@/hooks/useImageGeneration';
```

---

## 📊 请提供以下信息

为了准确诊断问题，请提供：

### 1. 浏览器控制台日志
```
完整的 "🔧 Worker URL Configuration" 输出
```

### 2. Network 请求详情
```
Request URL: ???
Request Method: POST
Status Code: ???
```

### 3. 部署平台信息
```
平台: Cloudflare Pages / Vercel / 其他
最新部署时间: ???
环境变量配置时间: ???
```

### 4. 构建日志（如果可以访问）
```
搜索 "NEXT_PUBLIC_WORKER_URL" 的结果
```

---

## ✅ 最可能的原因

根据经验，最可能的原因是：

1. **环境变量未应用到 Production 环境**（70% 可能性）
   - 只配置了 Preview 环境
   - 环境变量名称拼写错误

2. **部署时间早于环境变量配置**（20% 可能性）
   - 配置了环境变量但没有重新部署
   - 需要手动触发部署

3. **浏览器缓存了旧代码**（10% 可能性）
   - 强制刷新可以解决

---

**请按照步骤 1-5 逐步检查，并提供相关信息，我会根据实际情况给出精确的解决方案。**
