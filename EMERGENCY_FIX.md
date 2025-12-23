# 🚨 紧急修复 - 生产环境 404 错误

## ⚡ 立即修复（2 分钟）

我已经修改了代码，使用**硬编码的 Worker URL 作为后备方案**。

### 步骤 1: 提交更改
```bash
git add hooks/useImageGeneration.tsx
git commit -m "fix: use production Worker URL as fallback"
git push origin main
```

### 步骤 2: 等待自动部署
如果你的前端配置了自动部署（Cloudflare Pages 或 Vercel），推送后会自动触发新的部署。

### 步骤 3: 验证修复
部署完成后（通常 2-5 分钟）：
1. 访问 https://flux-ai-img.com
2. 清除浏览器缓存（Ctrl+Shift+R 或 Cmd+Shift+R）
3. 打开开发者工具 (F12)
4. 点击"生成图片"
5. 检查 Network 标签，应该看到请求发送到：
   ```
   https://flux-ai-worker-prod.liukai19911010.workers.dev/generation/generate
   ```

---

## 🔍 修改说明

### 修改前
```typescript
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 
    (process.env.NODE_ENV === 'production'
        ? 'https://flux-ai-worker-prod.liukai19911010.workers.dev'
        : 'http://localhost:8787');
```

### 修改后
```typescript
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 
    'https://flux-ai-worker-prod.liukai19911010.workers.dev';
```

**变化**:
- ✅ 移除了对 `NODE_ENV` 的判断
- ✅ 直接使用生产 Worker URL 作为后备
- ✅ 即使环境变量未注入，也能正常工作

---

## 📋 长期解决方案

虽然临时修复可以工作，但你仍然需要正确配置环境变量：

### 1. 确认部署平台

**Cloudflare Pages**:
1. 访问 https://dash.cloudflare.com
2. Workers & Pages → 找到你的项目
3. Settings → Environment variables
4. 添加：
   ```
   NEXT_PUBLIC_WORKER_URL=https://flux-ai-worker-prod.liukai19911010.workers.dev
   ```

**Vercel**:
1. 访问 https://vercel.com/dashboard
2. 找到你的项目 → Settings
3. Environment Variables
4. 添加：
   ```
   NEXT_PUBLIC_WORKER_URL=https://flux-ai-worker-prod.liukai19911010.workers.dev
   ```

### 2. 重新部署

添加环境变量后，触发新的部署：
```bash
git commit --allow-empty -m "trigger rebuild"
git push origin main
```

### 3. 验证环境变量

部署后，检查控制台日志：
```javascript
🔧 Worker URL Configuration: {
  NEXT_PUBLIC_WORKER_URL: "https://flux-ai-worker-prod.liukai19911010.workers.dev",
  ...
}
```

如果 `NEXT_PUBLIC_WORKER_URL` 有值，说明环境变量配置成功。

---

## ✅ 成功标志

修复成功后，你应该看到：

1. **控制台日志**:
```javascript
🔧 Worker URL Configuration: {
  WORKER_URL: "https://flux-ai-worker-prod.liukai19911010.workers.dev",
  fallback: "Using production Worker URL as fallback"
}
🚀 Sending generation request: {...}
✅ Generation successful: {...}
```

2. **Network 标签**:
```
Request URL: https://flux-ai-worker-prod.liukai19911010.workers.dev/generation/generate
Status: 200 OK (或其他非 404 状态)
```

3. **页面功能**:
- ✅ 没有 404 错误
- ✅ 图片生成成功或显示有意义的错误
- ✅ 积分系统正常工作

---

## 🆘 如果还是不行

### 检查 Worker 是否正常

在浏览器中直接访问：
```
https://flux-ai-worker-prod.liukai19911010.workers.dev/
```

应该看到：
```json
{
  "message": "Flux AI Cloudflare Worker - Hono Edition",
  "version": "2.0.0",
  "status": "healthy"
}
```

如果看不到这个响应，说明 Worker 本身有问题，需要重新部署 Worker。

### 检查 CORS 配置

如果 Worker 正常但前端还是报错，可能是 CORS 问题。检查浏览器控制台是否有 CORS 错误。

---

## 📞 需要帮助？

如果修复后还有问题，请提供：
1. 浏览器控制台的完整日志
2. Network 标签中的请求详情
3. 前端部署平台（Cloudflare Pages / Vercel / 其他）

---

**最后更新**: 2024-12-23 14:00  
**状态**: ✅ 代码已修复，等待部署  
**预计生效时间**: 2-5 分钟（自动部署）
