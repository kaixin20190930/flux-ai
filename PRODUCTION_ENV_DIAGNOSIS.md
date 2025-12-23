# 生产环境诊断指南

## 🎯 问题描述

生产环境中，前端仍然调用 `/api/generate` 而不是 Worker URL，即使：
- ✅ `NEXT_PUBLIC_WORKER_URL` 已在部署平台配置
- ✅ 前端已重新部署
- ✅ 代码中正确使用了环境变量

## 🔍 诊断步骤

### 步骤 1: 运行本地诊断脚本

```bash
node scripts/diagnose-production-env.js
```

这个脚本会检查：
- 本地环境变量配置
- 代码中如何使用环境变量
- Next.js 配置
- 构建配置

### 步骤 2: 访问生产环境测试页面

打开浏览器访问：
```
https://flux-ai-img.com/test-env.html
```

这个页面会：
1. 显示当前环境信息
2. 测试 Worker 连接
3. 提供诊断结果

点击 "Test Worker Connection" 按钮，然后点击 "Copy Results" 复制结果。

### 步骤 3: 检查浏览器控制台

1. 打开生产环境网站：https://flux-ai-img.com
2. 打开浏览器开发者工具（F12）
3. 切换到 Console 标签
4. 刷新页面（Ctrl+Shift+R 强制刷新）
5. 查找以下日志：

```javascript
🔧 Worker URL Configuration: {
  NEXT_PUBLIC_WORKER_URL: ???,  // 记录这个值
  NODE_ENV: "production",
  WORKER_URL: ???  // 记录这个值
}
```

**关键问题**：
- `NEXT_PUBLIC_WORKER_URL` 的值是什么？
- `WORKER_URL` 的值是什么？

### 步骤 4: 检查 Network 请求

1. 在开发者工具中切换到 Network 标签
2. 点击"生成图片"按钮
3. 查看失败的请求
4. 记录以下信息：

```
Request URL: ???  // 完整的 URL
Request Method: POST
Status Code: ???
```

### 步骤 5: 检查部署平台配置

#### Cloudflare Pages

1. 登录 Cloudflare Dashboard
2. 进入 Pages 项目
3. 点击 Settings -> Environment variables
4. 确认以下配置：

```
变量名: NEXT_PUBLIC_WORKER_URL
值: https://flux-ai-worker-prod.liukai19911010.workers.dev
环境: Production ✅ (必须勾选)
```

**重要**：确保勾选了 "Production" 环境，而不仅仅是 "Preview"。

#### Vercel

1. 登录 Vercel Dashboard
2. 进入项目
3. 点击 Settings -> Environment Variables
4. 确认以下配置：

```
Name: NEXT_PUBLIC_WORKER_URL
Value: https://flux-ai-worker-prod.liukai19911010.workers.dev
Environments: 
  ✅ Production
  ✅ Preview
  ✅ Development
```

**重要**：建议全部勾选，确保所有环境都有正确的配置。

### 步骤 6: 检查部署时间

1. 在部署平台的 Deployments 页面
2. 查看最新部署的时间戳
3. 确认部署时间**晚于**环境变量配置时间

如果部署时间早于环境变量配置时间，需要触发新的部署：

```bash
git commit --allow-empty -m "trigger rebuild for env vars"
git push origin main
```

## 📊 诊断结果分析

### 情况 A: `NEXT_PUBLIC_WORKER_URL` 是 `undefined`

**原因**: 环境变量未在构建时注入

**可能的问题**：
1. 环境变量名称拼写错误（区分大小写）
2. 环境变量未应用到 Production 环境
3. 部署时间早于环境变量配置时间

**解决方案**：
1. 检查环境变量名称是否完全正确：`NEXT_PUBLIC_WORKER_URL`
2. 确认环境变量应用到 Production 环境（不仅仅是 Preview）
3. 触发新的部署：
   ```bash
   git commit --allow-empty -m "trigger rebuild"
   git push origin main
   ```
4. 等待部署完成后，强制刷新浏览器（Ctrl+Shift+R）

### 情况 B: `NEXT_PUBLIC_WORKER_URL` 有值，但 `WORKER_URL` 是 `undefined`

**原因**: 代码逻辑问题（这种情况理论上不应该发生）

**检查代码**：
```typescript
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 
    (process.env.NODE_ENV === 'production'
        ? 'https://flux-ai-worker-prod.liukai19911010.workers.dev'
        : 'http://localhost:8787');
```

这个逻辑应该总是有值。如果 `WORKER_URL` 是 `undefined`，说明：
1. 代码被意外修改
2. 有其他代码覆盖了这个变量
3. 浏览器缓存了旧版本代码

**解决方案**：
1. 检查 `hooks/useImageGeneration.tsx` 文件
2. 确认 WORKER_URL 定义没有被修改
3. 强制刷新浏览器（Ctrl+Shift+R）
4. 清除浏览器缓存

### 情况 C: `WORKER_URL` 有正确的值，但请求还是发送到 `/api/generate`

**原因**: 可能有其他代码在调用 API，或者浏览器缓存问题

**排查步骤**：

1. 检查是否有多个版本的 hook：
   ```bash
   find . -name "*useImageGeneration*" -type f | grep -v node_modules
   ```

2. 检查哪些组件在使用这个 hook：
   ```bash
   grep -r "from.*useImageGeneration" --include="*.tsx" --include="*.ts" | grep -v node_modules
   ```

3. 强制刷新浏览器：
   - Windows/Linux: Ctrl+Shift+R
   - Mac: Cmd+Shift+R

4. 清除浏览器缓存：
   - Chrome: Settings -> Privacy and security -> Clear browsing data
   - 选择 "Cached images and files"
   - 时间范围选择 "All time"

### 情况 D: Request URL 包含 Worker 域名，但仍然 404

**原因**: Worker 端点路径不匹配

**检查**：
- 前端调用: `${WORKER_URL}/generation/generate`
- Worker 路由: 应该有 `/generation/generate` 端点

**解决方案**：
1. 检查 Worker 是否正确部署：
   ```bash
   curl https://flux-ai-worker-prod.liukai19911010.workers.dev/health
   ```

2. 检查 Worker 路由配置：
   ```bash
   grep -r "generation/generate" worker/
   ```

3. 重新部署 Worker：
   ```bash
   cd worker
   wrangler deploy --env production
   ```

## 🔧 快速修复方案

### 方案 1: 重新配置环境变量并部署

```bash
# 1. 确认环境变量配置正确（在部署平台）
# 2. 触发新的部署
git commit --allow-empty -m "rebuild: fix environment variables"
git push origin main

# 3. 等待部署完成（通常 2-5 分钟）
# 4. 强制刷新浏览器
```

### 方案 2: 清除缓存并重新测试

```bash
# 1. 清除浏览器缓存
# 2. 关闭所有浏览器窗口
# 3. 重新打开浏览器
# 4. 访问 https://flux-ai-img.com
# 5. 打开开发者工具查看日志
```

### 方案 3: 使用隐私模式测试

```bash
# 1. 打开浏览器隐私模式（Incognito/Private）
# 2. 访问 https://flux-ai-img.com
# 3. 查看是否正常工作
# 4. 如果正常，说明是缓存问题
```

## 📝 需要提供的信息

为了精确诊断问题，请提供以下信息：

### 1. 浏览器控制台日志
```
🔧 Worker URL Configuration: {
  NEXT_PUBLIC_WORKER_URL: ???,
  NODE_ENV: ???,
  WORKER_URL: ???
}
```

### 2. Network 请求详情
```
Request URL: ???
Request Method: ???
Status Code: ???
Response: ???
```

### 3. 部署平台信息
```
平台: Cloudflare Pages / Vercel / 其他
项目名称: ???
最新部署时间: ???
环境变量配置时间: ???
环境变量配置截图: （如果可以提供）
```

### 4. 测试页面结果
```
访问 https://flux-ai-img.com/test-env.html
点击 "Test Worker Connection"
点击 "Copy Results"
粘贴结果
```

### 5. 本地诊断脚本输出
```bash
node scripts/diagnose-production-env.js
# 复制完整输出
```

## ✅ 最可能的原因（按概率排序）

1. **环境变量未应用到 Production 环境**（70%）
   - 只配置了 Preview 环境
   - 环境变量名称拼写错误
   - 环境变量值有多余的空格或引号

2. **部署时间早于环境变量配置**（20%）
   - 配置了环境变量但没有重新部署
   - 需要手动触发部署

3. **浏览器缓存了旧代码**（10%）
   - 强制刷新可以解决
   - 清除缓存可以解决

## 🚀 下一步行动

1. **立即执行**：
   - 运行 `node scripts/diagnose-production-env.js`
   - 访问 `https://flux-ai-img.com/test-env.html`
   - 收集上述所有诊断信息

2. **提供信息**：
   - 将所有诊断结果整理成一份报告
   - 包含截图（如果可能）
   - 提供给开发团队

3. **等待分析**：
   - 根据诊断结果，我会提供精确的解决方案
   - 可能需要调整配置或代码

---

**重要提示**：
- 不要同时尝试多个解决方案
- 每次修改后等待部署完成再测试
- 使用强制刷新（Ctrl+Shift+R）避免缓存问题
- 如果问题持续，提供完整的诊断信息

---

**联系方式**：
如果按照以上步骤仍无法解决，请提供完整的诊断信息，我会进一步分析。
