# Cloudflare Pages 环境变量修复指南

## 🎯 问题描述

生产环境中，前端代码调用 `/api/generate` 而不是 Worker URL，即使环境变量已正确配置。

**原因**: Cloudflare Pages 使用 `@cloudflare/next-on-pages` 构建适配器，环境变量在构建时的处理方式与标准 Next.js 不同。

## ✅ 已完成的修复

### 1. 修改了 `hooks/useImageGeneration.tsx`

将静态的环境变量读取改为运行时函数：

```typescript
// ❌ 旧代码（会被构建时优化）
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || ...

// ✅ 新代码（运行时动态获取）
const getWorkerUrl = () => {
    if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WORKER_URL) {
        return process.env.NEXT_PUBLIC_WORKER_URL;
    }
    
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8787';
        } else {
            return 'https://flux-ai-worker-prod.liukai19911010.workers.dev';
        }
    }
    
    return 'https://flux-ai-worker-prod.liukai19911010.workers.dev';
};
```

### 2. 优势

- ✅ 不依赖构建时环境变量
- ✅ 根据实际运行环境动态判断
- ✅ 兼容 Cloudflare Pages 的构建流程
- ✅ 保留了环境变量优先级
- ✅ 本地开发和生产环境都能正常工作

## 🚀 部署步骤

### 1. 提交代码

```bash
git add hooks/useImageGeneration.tsx
git commit -m "fix: use runtime worker URL detection for Cloudflare Pages"
git push origin main
```

### 2. 等待 Cloudflare Pages 自动部署

- 登录 Cloudflare Dashboard
- 进入 Pages 项目
- 查看 Deployments 页面
- 等待最新部署完成（通常 2-5 分钟）

### 3. 验证部署

部署完成后，访问：
```
https://flux-ai-img.com
```

打开浏览器开发者工具（F12），查看 Console：

**预期日志**：
```javascript
🔧 Worker URL Configuration: {
  NEXT_PUBLIC_WORKER_URL: "https://flux-ai-worker-prod.liukai19911010.workers.dev" 或 "undefined",
  NODE_ENV: "production" 或 "undefined",
  hostname: "flux-ai-img.com",
  WORKER_URL: "https://flux-ai-worker-prod.liukai19911010.workers.dev"
}
```

**关键点**: `WORKER_URL` 必须是完整的 Worker URL，而不是 `undefined`。

### 4. 测试图片生成

1. 点击"生成图片"按钮
2. 查看 Network 标签
3. 确认请求 URL 是：
   ```
   POST https://flux-ai-worker-prod.liukai19911010.workers.dev/generation/generate
   ```
   而不是：
   ```
   POST https://flux-ai-img.com/api/generate
   ```

## 🔍 故障排查

### 问题 1: 仍然调用 `/api/generate`

**检查**：
1. 确认代码已推送到 GitHub
2. 确认 Cloudflare Pages 已完成最新部署
3. 强制刷新浏览器（Ctrl+Shift+R）
4. 清除浏览器缓存

**解决**：
```bash
# 清除浏览器缓存
# Chrome: Settings → Privacy and security → Clear browsing data
# 选择 "Cached images and files"
# 时间范围: "All time"

# 或使用隐私模式测试
# Chrome: Ctrl+Shift+N
# Firefox: Ctrl+Shift+P
```

### 问题 2: Worker URL 仍然是 `undefined`

**检查**：
1. 查看浏览器控制台的完整日志
2. 确认 `hostname` 字段的值
3. 确认代码逻辑是否正确执行

**解决**：
```javascript
// 在浏览器控制台手动测试
console.log('hostname:', window.location.hostname);
console.log('expected:', 'flux-ai-img.com');
console.log('match:', window.location.hostname === 'flux-ai-img.com');
```

### 问题 3: Worker 返回 500 错误

这是另一个问题（Worker 内部错误），与环境变量无关。

**检查 Worker 日志**：
```bash
cd worker
wrangler tail --env production
```

然后在前端触发请求，查看 Worker 的错误日志。

## 📊 验证清单

部署后，逐项检查：

- [ ] 代码已推送到 GitHub
- [ ] Cloudflare Pages 显示最新部署成功
- [ ] 浏览器已强制刷新（Ctrl+Shift+R）
- [ ] Console 显示正确的 Worker URL
- [ ] Network 请求发送到 Worker URL
- [ ] 不再出现 404 错误

## 🎯 为什么这个方案有效？

### Cloudflare Pages 的特殊性

Cloudflare Pages 使用 `@cloudflare/next-on-pages` 将 Next.js 应用转换为 Cloudflare Pages Functions。在这个过程中：

1. **构建时优化**: Next.js 会在构建时将 `process.env.NEXT_PUBLIC_*` 内联替换
2. **环境差异**: Cloudflare Pages 的运行时环境与标准 Node.js 不同
3. **变量注入时机**: 环境变量可能在构建后才注入

### 我们的解决方案

通过使用运行时函数 `getWorkerUrl()`：

1. **延迟求值**: 不在模块加载时立即求值
2. **运行时检测**: 在浏览器中根据 `window.location.hostname` 判断
3. **Fallback 机制**: 即使环境变量不可用，也能正确工作
4. **兼容性**: 同时支持标准 Next.js 和 Cloudflare Pages

## 🔄 回滚方案

如果新代码有问题，可以快速回滚：

```bash
# 回滚到上一个提交
git revert HEAD
git push origin main

# 或回滚到特定提交
git log --oneline  # 查看提交历史
git revert <commit-hash>
git push origin main
```

## 📝 后续优化建议

### 1. 添加环境变量验证

在 `next.config.js` 中添加：

```javascript
if (process.env.NODE_ENV === 'production') {
  if (!process.env.NEXT_PUBLIC_WORKER_URL) {
    console.warn('⚠️  NEXT_PUBLIC_WORKER_URL not set, using fallback');
  }
}
```

### 2. 添加运行时监控

在生产环境添加错误监控：

```typescript
if (WORKER_URL.includes('localhost')) {
  console.warn('⚠️  Using localhost Worker URL in production!');
}
```

### 3. 使用 Cloudflare Pages 的环境变量 API

考虑使用 Cloudflare Pages 的原生环境变量注入方式（如果可用）。

---

## ✅ 总结

**问题**: Cloudflare Pages 构建时环境变量未正确注入  
**原因**: `@cloudflare/next-on-pages` 的特殊构建流程  
**解决**: 使用运行时函数动态获取 Worker URL  
**效果**: 不依赖构建时环境变量，根据实际域名判断

**关键改进**: 从静态变量改为运行时函数，确保在任何环境下都能正确获取 Worker URL。
