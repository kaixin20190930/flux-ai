# Cloudflare Pages 部署策略

## 🎯 混合 Runtime 策略

由于 Edge Runtime 的限制，我们采用混合策略：

### Edge Runtime 路由
这些路由兼容 Edge Runtime，可以在 Cloudflare Pages 上运行：
- 简单的 API 端点（如健康检查、ping）
- 不需要 Node.js 特定功能的路由
- 静态数据返回的路由

### Node.js Runtime 路由
这些路由需要 Node.js 功能，不能在 Cloudflare Pages 上运行：
- 使用 crypto 模块的路由
- 使用 next-auth 的路由
- 使用 bcryptjs 的路由
- 需要文件系统访问的路由
- 复杂数据库操作的路由

## 🚀 部署选项

### 选项 1: Vercel 部署（推荐）
Vercel 原生支持 Next.js 和混合 Runtime：
```bash
npm run build
# 部署到 Vercel
```

### 选项 2: 自托管
使用 Docker 或其他平台：
```bash
npm run build
npm start
```

### 选项 3: 部分 Cloudflare Pages
只部署兼容 Edge Runtime 的路由到 Cloudflare Pages，
其他路由部署到支持 Node.js 的平台。

## 🔧 Edge Runtime 兼容性改进

如果要完全兼容 Cloudflare Pages，需要：

1. **替换加密库**：
   - 移除 bcryptjs，使用 Web Crypto API
   - 移除 jsonwebtoken，使用自定义 JWT 实现

2. **替换认证系统**：
   - 移除 next-auth
   - 使用 Cloudflare Access 或自定义认证

3. **数据库适配**：
   - 使用 Cloudflare D1 (SQLite)
   - 或使用支持 Edge Runtime 的数据库客户端

4. **环境变量处理**：
   - 在构建时注入环境变量
   - 使用 Cloudflare Pages 的环境变量系统

## 📊 当前状态

- ✅ 项目可以在支持 Node.js 的平台上运行
- ⚠️  部分路由不兼容 Cloudflare Pages Edge Runtime
- 🔄 需要重构以完全兼容 Edge Runtime

## 💡 建议

1. **短期**：部署到 Vercel 或其他支持 Node.js 的平台
2. **长期**：逐步重构以兼容 Edge Runtime，享受 Cloudflare 的性能优势
