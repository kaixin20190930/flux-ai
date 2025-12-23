# 修复 404 错误 - 完整指南

## 🔍 问题诊断

### 错误现象
```
Failed to load resource: the server responded with a status of 404 ()
/api/generate:1
```

### 根本原因
前端调用了错误的 URL：
- ❌ 错误：`https://flux-ai-img.com/api/generate`
- ✅ 正确：`https://flux-ai-worker-prod.liukai19911010.workers.dev/generation/generate`

### 为什么会这样？
`NEXT_PUBLIC_WORKER_URL` 环境变量已添加到 `.env.local`，但 Next.js **需要重启**才能读取新的环境变量。

---

## ✅ 解决方案

### 步骤 1: 停止当前的开发服务器

在运行 `npm run dev` 的终端中按 `Ctrl+C` 停止服务器。

### 步骤 2: 清除 Next.js 缓存

```bash
rm -rf .next
```

### 步骤 3: 重新启动开发服务器

```bash
npm run dev
```

### 步骤 4: 验证环境变量

打开浏览器控制台 (F12)，应该看到：

```javascript
🔧 Worker URL Configuration: {
  NEXT_PUBLIC_WORKER_URL: "https://flux-ai-worker-prod.liukai19911010.workers.dev",
  NODE_ENV: "development",
  WORKER_URL: "https://flux-ai-worker-prod.liukai19911010.workers.dev"
}
```

### 步骤 5: 测试生成图片

1. 刷新页面 (F5)
2. 打开开发者工具 Network 标签
3. 点击"生成图片"按钮
4. 检查请求 URL 应该是：
   ```
   https://flux-ai-worker-prod.liukai19911010.workers.dev/generation/generate
   ```

---

## 🚀 快速重启脚本

我已经创建了一个自动化脚本：

```bash
./scripts/restart-dev-with-env.sh
```

这个脚本会：
1. ✅ 检查 `.env.local` 配置
2. ✅ 停止现有的开发服务器
3. ✅ 清除 Next.js 缓存
4. ✅ 重新启动开发服务器

---

## 🔍 调试技巧

### 1. 检查环境变量是否加载

在浏览器控制台运行：
```javascript
console.log('WORKER_URL:', process.env.NEXT_PUBLIC_WORKER_URL);
```

### 2. 检查实际请求 URL

在 Network 标签中查看请求：
- 点击请求
- 查看 Headers 标签
- 检查 Request URL

### 3. 查看完整的调试日志

在浏览器控制台应该看到：
```
🔧 Worker URL Configuration: {...}
🔍 Fetching generation status with fingerprint: ...
📊 Status response: {...}
🚀 Sending generation request: {...}
```

---

## 📋 环境变量配置检查清单

- [x] `.env.local` 文件存在
- [x] `NEXT_PUBLIC_WORKER_URL` 已配置
- [ ] 开发服务器已重启
- [ ] 浏览器已刷新
- [ ] 控制台显示正确的 Worker URL
- [ ] Network 请求指向 Worker URL

---

## 🆘 如果还是不行

### 方案 1: 手动验证配置

```bash
# 1. 检查 .env.local
cat .env.local | grep NEXT_PUBLIC_WORKER_URL

# 2. 应该输出:
# NEXT_PUBLIC_WORKER_URL=https://flux-ai-worker-prod.liukai19911010.workers.dev
```

### 方案 2: 完全清理并重启

```bash
# 1. 停止所有 Node 进程
pkill -f "next dev"

# 2. 清除所有缓存
rm -rf .next
rm -rf node_modules/.cache

# 3. 重新启动
npm run dev
```

### 方案 3: 检查 Worker 是否正常

在浏览器中访问：
```
https://flux-ai-worker-prod.liukai19911010.workers.dev/
```

应该看到：
```json
{
  "message": "Flux AI Cloudflare Worker - Hono Edition",
  "version": "2.0.0",
  "environment": "production",
  "timestamp": "...",
  "status": "healthy"
}
```

---

## 📊 预期的请求流程

```
用户点击"生成图片"
    ↓
前端读取 NEXT_PUBLIC_WORKER_URL
    ↓
发送 POST 请求到:
https://flux-ai-worker-prod.liukai19911010.workers.dev/generation/generate
    ↓
Worker 处理请求
    ↓
返回生成的图片 URL
```

---

## ✅ 成功标志

当一切正常时，你应该看到：

1. **控制台日志**：
   ```
   🔧 Worker URL Configuration: {
     NEXT_PUBLIC_WORKER_URL: "https://flux-ai-worker-prod.liukai19911010.workers.dev",
     ...
   }
   🚀 Sending generation request: {...}
   ✅ Generation successful: {...}
   ```

2. **Network 标签**：
   - 请求 URL: `https://flux-ai-worker-prod.liukai19911010.workers.dev/generation/generate`
   - 状态码: 200 OK
   - 响应包含图片 URL

3. **页面显示**：
   - 生成的图片正常显示
   - 没有错误提示

---

**最后更新**: 2024-12-23  
**状态**: ✅ 配置完成，等待重启验证
