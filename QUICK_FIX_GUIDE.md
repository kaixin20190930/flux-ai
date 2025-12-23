# 🚀 快速修复指南 - 404 错误

## ⚡ 3 步快速修复

### 1️⃣ 停止开发服务器
在终端按 `Ctrl+C`

### 2️⃣ 清除缓存
```bash
rm -rf .next
```

### 3️⃣ 重新启动
```bash
npm run dev
```

---

## ✅ 验证修复

打开浏览器控制台 (F12)，应该看到：

```javascript
🔧 Worker URL Configuration: {
  WORKER_URL: "https://flux-ai-worker-prod.liukai19911010.workers.dev"
}
```

然后点击"生成图片"，Network 标签应该显示请求发送到：
```
https://flux-ai-worker-prod.liukai19911010.workers.dev/generation/generate
```

---

## 🎯 问题原因

环境变量 `NEXT_PUBLIC_WORKER_URL` 已添加，但 Next.js 需要重启才能读取。

---

## 📞 需要帮助？

查看详细文档：
- `FIX_404_ERROR.md` - 完整修复指南
- `FRONTEND_DEPLOYMENT_GUIDE.md` - 部署指南

或运行自动化脚本：
```bash
./scripts/restart-dev-with-env.sh
```
